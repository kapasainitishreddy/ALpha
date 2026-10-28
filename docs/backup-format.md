# Device backup format and restore behavior

BlackScythe Alpha keeps three user-data groups in browser storage:

| Storage key | Contents |
|---|---|
| `blackscythe-alpha` | Main paper-account state, lessons, journal, pending orders, replay sessions and recent order events |
| `alpha-derivatives` | Separate simulated derivatives balance, positions and lab cursor |
| `alpha-research-note` | Six-field thesis checklist |

The version 2 `alpha-paper-backup` JSON contains all three groups. Restore validates the complete file before writing any group, shows counts and balance for review, asks the user to confirm, and writes the included storage values as one rollback-protected transaction. The app reloads after a successful write so its in-memory store reads the restored snapshot. If a storage write fails, previous values are restored; an incomplete rollback is reported explicitly.

Restore does not merge transactions. It replaces the account snapshot. Repeating the same restore yields the same account data; it does not execute orders or apply P/L. API keys and optional model credentials are excluded from export and are cleared from persisted account state on restore. Order-event history is included in v2 as capped, user-visible audit context.

The Portfolio screen also offers an explicitly confirmed delete action for these three modeled data keys. Deletion uses the same rollback behavior and leaves unrelated browser storage keys and cached app assets alone.

Version 1 files contain only the main paper account. They remain importable. Because they do not contain derivatives, research notes or order events, a v1 restore preserves those records on the current device and the preview explains that behavior. Importing v1 onto a new browser does not recreate those absent records.

The size cap is 5,000,000 UTF-8 bytes. Unknown versions, malformed records, duplicate IDs, invalid balances, out-of-range quantities, unsupported symbols, invalid candle histories and corrupted local export data are rejected. Browser storage is device-local and is not cloud sync. Export a fresh file after material practice changes.
