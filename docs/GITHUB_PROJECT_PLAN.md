# GitHub Project Organization Plan

## Labels

### Core Classification
- `type:bug`, `type:feature`, `type:task`, `type:docs`, `type:security`
- `priority:P0`, `priority:P1`, `priority:P2`
- `difficulty:beginner`, `difficulty:intermediate`, `difficulty:advanced`
- `size:S`, `size:M`, `size:L`, `size:XL`

### Status & Workflow
- `status:blocked`, `status:needs-design`, `status:ready`
- `status:in-review`, `status:done`

### Wave 5 Specifics
- `wave:5`
- `phase:1` through `phase:7`
- `track:FE`, `track:BE`, `track:SC`, `track:SDK`, `track:DEVOPS`, `track:QA`, `track:SECURITY`, `track:DX`, `track:DOCS`, `track:AI/AUTOMATION`

### Areas (Legacy/Legacy Mapping)
- `area:frontend`, `area:backend`, `area:onchain`, `area:devex`, `area:docs`
- `stellar:migration`, `drips:wave`

## Milestones
1. `M1 - Repository Hardening`
2. `M2 - Soroban Contract Parity`
3. `M3 - Stellar Wallet Integration`
4. `M4 - Drips/Wave Contributor Expansion`

## Board Columns & Lane Definitions

| Column | Purpose | Entry Criteria | Exit Criteria |
| :--- | :--- | :--- | :--- |
| **Inbox (Triage)** | New incoming issues. | Issue created; missing core labels. | Labeled with `track`, `difficulty`, `size`, `phase`, `priority`. |
| **Backlog** | Validated and scoped tasks. | Core labels present; `status:ready` or `status:blocked`. | Moved to **Ready** when prioritized for active Milestone. |
| **Ready** | Available for contributors. | `status:ready`; part of active Milestone. | Contributor assigned. |
| **In Progress** | Active development. | Assigned to contributor. | PR submitted and linked to issue. |
| **In Review** | Peer review and CI validation. | PR submitted; CI passing. | PR approved and merged. |
| **Done** | Completed work. | PR merged; issue closed. | N/A |

## Track-Based Routing Rules

Issues are categorized by **Track** to balance reviewer load and contributor specialty.

| Track | Primary Labels | Board Routing / Focus |
| :--- | :--- | :--- |
| **Core Migration** | `track:SC`, `track:BE` | High-priority; gated by migration milestones. |
| **Integration** | `track:SDK`, `track:FE` | Focused on ergonomics and wallet-contract interfaces. |
| **Stability/Ops** | `track:QA`, `track:DEVOPS` | Continuous support; unblocks other tracks. |
| **DevEx/Docs** | `track:DX`, `track:DOCS` | High-velocity "Easy Wins" for new contributors. |
| **Automation** | `track:AI/AUTOMATION` | Workflow and triage optimization. |

### Routing by Difficulty & Size
- **Beginner (S/M)**: Routed to **Ready** queue immediately for new contributors.
- **Intermediate (M/L)**: Standard track for experienced contributors.
- **Advanced (L/XL)**: Requires maintainer synchronization before assignment.

## Maintainer Triage Routine

To reduce triage latency and ensure consistent issue quality, maintainers follow this routine 2x per week:

1. **Scan Inbox**: Review all issues in the **Inbox (Triage)** column.
2. **Assign Track**: Apply the most relevant `track:*` label.
3. **Assess Difficulty/Size**: Estimate impact and complexity based on [WAVE5_ISSUE_TRACKS.md](./wave/WAVE5_ISSUE_TRACKS.md).
4. **Map to Phase**: Assign the issue to the current or future `phase:*` Milestone.
5. **Set Status**: 
   - Apply `status:ready` if the objective, scope, and acceptance criteria are clear.
   - Apply `status:blocked` if external dependencies or design decisions are pending.
6. **Promote**: Move to **Backlog** or **Ready** (if prioritized).
7. **Clean Up**: Ensure every issue has a clear "Acceptance Criteria" checklist before it reaches the **Ready** column.

## Prioritization Rules
- P0: security, broken builds, data integrity
- P1: user-facing defects, migration blockers
- P2: quality improvements and enhancements
