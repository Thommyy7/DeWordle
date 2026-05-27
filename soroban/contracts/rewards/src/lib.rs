#![no_std]

pub mod fixtures;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Symbol,
};

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Emission(u32),
    Balance(Address),
    Claimed(Address),
    Nonce(Address, u64),
}

#[derive(Clone)]
#[contracttype]
pub struct EmissionConfig {
    pub day_id: u32,
    pub win_points: u64,
    pub participation_points: u64,
}

#[derive(Clone)]
#[contracterror]
#[repr(u32)]
pub enum RewardsError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidNonce = 4,
}

#[contract]
pub struct RewardsContract;

#[contractimpl]
impl RewardsContract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, RewardsError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((Symbol::new(&env, "rewards_initialized"),), admin);
    }

    pub fn set_emission(
        env: Env,
        day_id: u32,
        win_points: u64,
        participation_points: u64,
    ) {
        Self::require_admin(&env);
        let cfg = EmissionConfig {
            day_id,
            win_points,
            participation_points,
        };
        env.storage().persistent().set(&DataKey::Emission(day_id), &cfg);
        env.events().publish((Symbol::new(&env, "emission_set"), day_id), cfg);
    }

    pub fn accrue(env: Env, player: Address, points: u64, nonce: u64, reason: Symbol) {
        Self::require_admin(&env);
        if env
            .storage()
            .persistent()
            .has(&DataKey::Nonce(player.clone(), nonce))
        {
            panic_with_error!(&env, RewardsError::InvalidNonce);
        }

        let balance = Self::balance_of(env.clone(), player.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Balance(player.clone()), &(balance + points));
        env.storage()
            .persistent()
            .set(&DataKey::Nonce(player.clone(), nonce), &true);

        env.events().publish(
            (Symbol::new(&env, "accrued"), player, reason),
            (points, nonce),
        );
    }

    pub fn claim(env: Env, player: Address) -> u64 {
        player.require_auth();

        let balance = Self::balance_of(env.clone(), player.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Balance(player.clone()), &0u64);

        let claimed = Self::claimed_total(env.clone(), player.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(player.clone()), &(claimed + balance));

        env.events()
            .publish((Symbol::new(&env, "claimed"), player), balance);
        balance
    }

    pub fn balance_of(env: Env, player: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(player))
            .unwrap_or(0)
    }

    pub fn claimed_total(env: Env, player: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::Claimed(player))
            .unwrap_or(0)
    }

    pub fn get_emission(env: Env, day_id: u32) -> Option<EmissionConfig> {
        env.storage().persistent().get(&DataKey::Emission(day_id))
    }

    pub fn version(env: Env) -> u32 {
        env.events().publish(
            (Symbol::new(&env, "module"), Symbol::new(&env, "rewards")),
            2u32,
        );
        2
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, RewardsError::NotInitialized));

        admin.require_auth();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        RewardsContract::init(env.clone(), admin.clone());
        (env, admin)
    }

    #[test]
    #[should_panic]
    fn init_twice_panics() {
        let (env, admin) = setup();
        RewardsContract::init(env, admin);
    }

    #[test]
    fn accrue_and_balance() {
        let (env, _) = setup();
        let player = Address::generate(&env);
        let reason = Symbol::new(&env, "win");
        RewardsContract::accrue(env.clone(), player.clone(), 100, 1, reason);
        assert_eq!(RewardsContract::balance_of(env, player), 100);
    }

    #[test]
    #[should_panic]
    fn nonce_replay_panics() {
        let (env, _) = setup();
        let player = Address::generate(&env);
        let reason = Symbol::new(&env, "win");
        RewardsContract::accrue(env.clone(), player.clone(), 100, 1, reason.clone());
        RewardsContract::accrue(env, player, 100, 1, reason);
    }

    #[test]
    fn claim_resets_balance_and_increases_claimed_total() {
        let (env, _) = setup();
        let player = Address::generate(&env);
        let reason = Symbol::new(&env, "win");
        RewardsContract::accrue(env.clone(), player.clone(), 50, 1, reason);
        let claimed = RewardsContract::claim(env.clone(), player.clone());
        assert_eq!(claimed, 50);
        assert_eq!(RewardsContract::balance_of(env.clone(), player.clone()), 0);
        assert_eq!(RewardsContract::claimed_total(env, player), 50);
    }

    #[test]
    fn non_admin_accrue_rejected() {
        let env = Env::default();
        let admin = Address::generate(&env);
        RewardsContract::init(env.clone(), admin);
        // Without mock_all_auths, admin.require_auth() will panic for non-admin caller
        let player = Address::generate(&env);
        let reason = Symbol::new(&env, "win");
        // This should panic because auth is not mocked
        let result = std::panic::catch_unwind(|| {
            RewardsContract::accrue(env.clone(), player, 100, 1, reason);
        });
        assert!(result.is_err());
    }

    #[test]
    fn emission_config_read_write() {
        let (env, _) = setup();
        RewardsContract::set_emission(env.clone(), 1, 100, 10);
        let cfg = RewardsContract::get_emission(env, 1).unwrap();
        assert_eq!(cfg.win_points, 100);
        assert_eq!(cfg.participation_points, 10);
    }

    #[test]
    fn event_topics_match_fixtures() {
        assert_eq!(fixtures::TOPIC_ACCRUED, "accrued");
        assert_eq!(fixtures::TOPIC_CLAIMED, "claimed");
        assert_eq!(fixtures::TOPIC_EMISSION_SET, "emission_set");
    }
}