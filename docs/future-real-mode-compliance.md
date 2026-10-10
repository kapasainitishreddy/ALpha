# Real mode prerequisites

This release cannot place broker orders. Mock profits are not earnings. Adding real execution is a separate product decision, not enabled by collecting a key in API Settings.

Before such a change: select a regulated broker and a supported product/jurisdiction; establish server-side secret handling and user authentication; implement order preview and explicit user authorization, idempotent submissions, broker acknowledgements, partial fills, cancellations, reconciliation, exchange lot/tick/margin/expiry rules, exposure limits and a kill switch; use suitable licensed data and document fees, funding, taxation and legal requirements. Broker outages and gap risks require monitoring and support. Automated execution would need a separate review and authorization.

The cosmetic Vite passcode, browser local storage and client-side AI limits are not substitutes for these controls. Neither paper results nor an LLM establish that real trading will earn money.
