#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Symbol,
};

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Contract(Symbol),
    Role(Symbol, Address),
}

#[derive(Clone)]
#[contracterror]
#[repr(u32)]
pub enum AdminRegistryError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    MissingContract = 4,
}

#[contract]
pub struct AdminRegistryContract;

#[contractimpl]
impl AdminRegistryContract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, AdminRegistryError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((Symbol::new(&env, "registry_initialized"),), admin);
    }

    pub fn set_contract(env: Env, key: Symbol, contract_address: Address) {
        Self::require_admin(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Contract(key.clone()), &contract_address);
        env.events().publish((Symbol::new(&env, "contract_set"), key), contract_address);
    }

    pub fn get_contract(env: Env, key: Symbol) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Contract(key))
            .unwrap_or_else(|| panic_with_error!(&env, AdminRegistryError::MissingContract))
    }

    pub fn set_role(env: Env, role: Symbol, member: Address, enabled: bool) {
        Self::require_admin(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Role(role.clone(), member.clone()), &enabled);
        env.events().publish((Symbol::new(&env, "role_set"), role, member), enabled);
    }

    pub fn has_role(env: Env, role: Symbol, member: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Role(role, member))
            .unwrap_or(false)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, AdminRegistryError::NotInitialized))
    }

    pub fn version(env: Env) -> u32 {
        env.events().publish(
            (Symbol::new(&env, "module"), Symbol::new(&env, "admin_registry")),
            2u32,
        );
        2
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, AdminRegistryError::NotInitialized));
        admin.require_auth();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn init_sets_admin_and_rejects_double_init() {
        let env = Env::default();
        let admin = Address::generate(&env);

        AdminRegistryContract::init(env.clone(), admin.clone());

        // Second init must panic with AlreadyInitialized
        let result = std::panic::catch_unwind(|| {
            AdminRegistryContract::init(env.clone(), admin.clone());
        });
        assert!(result.is_err());
    }

    #[test]
    fn set_and_get_contract() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_addr = Address::generate(&env);
        let key = Symbol::new(&env, "core_game");

        AdminRegistryContract::init(env.clone(), admin);
        AdminRegistryContract::set_contract(env.clone(), key.clone(), contract_addr.clone());

        let retrieved = AdminRegistryContract::get_contract(env.clone(), key);
        assert_eq!(retrieved, contract_addr);
    }

    #[test]
    fn get_contract_missing_panics() {
        let env = Env::default();
        let admin = Address::generate(&env);
        AdminRegistryContract::init(env.clone(), admin);

        let result = std::panic::catch_unwind(|| {
            AdminRegistryContract::get_contract(env.clone(), Symbol::new(&env, "missing"));
        });
        assert!(result.is_err());
    }

    #[test]
    fn set_and_check_role() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let member = Address::generate(&env);
        let role = Symbol::new(&env, "pauser");

        AdminRegistryContract::init(env.clone(), admin);

        // Default: no role
        assert!(!AdminRegistryContract::has_role(env.clone(), role.clone(), member.clone()));

        AdminRegistryContract::set_role(env.clone(), role.clone(), member.clone(), true);
        assert!(AdminRegistryContract::has_role(env.clone(), role.clone(), member.clone()));

        AdminRegistryContract::set_role(env.clone(), role.clone(), member.clone(), false);
        assert!(!AdminRegistryContract::has_role(env.clone(), role, member));
    }

    #[test]
    fn get_admin_returns_initialized_admin() {
        let env = Env::default();
        let admin = Address::generate(&env);
        AdminRegistryContract::init(env.clone(), admin.clone());
        assert_eq!(AdminRegistryContract::get_admin(env), admin);
    }

    #[test]
    fn get_admin_before_init_panics() {
        let env = Env::default();
        let result = std::panic::catch_unwind(|| {
            AdminRegistryContract::get_admin(env.clone());
        });
        assert!(result.is_err());
    }
}
