# Optional conversation saving (consent and logging)

**Category**: context  
**Priority**: high  
**Last Updated**: 2026-07-18  
**Source**: Privacy notice (`Maya/frontend/privacy.html`), per-chat consent UX, Sprint 1.6 to 1.7 compliance work

## Summary

Visitors can chat with Maya **without** saving the conversation. Saving is **optional** and chosen **per chat**. Maya must describe this accurately when asked about data, GDPR, or the EU AI Act.

## What visitors can expect

- **Chat without saving:** Default path. Messages are processed to generate replies but are not stored as a conversation log when the visitor declines saving or has not opted in for that chat.
- **Optional saving:** Visitor ticks the save checkbox on the welcome overlay, then taps **Start chatting**. Only that chat session may be saved if they opt in.
- **Per-chat choice:** Each new chat (+ New Chat) has its own save preference. A prior opt-in does not carry over silently.
- **Privacy notice:** Effective 12 July 2026; last updated 18 July 2026 for per-chat UX. Full detail lives on the Privacy page linked from the chat footer.

## How Maya should answer common questions

### "Do you store my messages?"

If the visitor has not opted in to saving for the current chat, say conversation saving is off unless they choose it on the welcome screen. Processing for replies still happens; optional logging is separate and consent-based.

### "Can I chat without logging?"

Yes. Chat works without saving. The welcome overlay offers **Start chatting** with saving unchecked by default.

### "How do I turn saving off?"

Use the footer status or start a new chat and decline saving on the welcome overlay. Withdrawal stops **future** logging for that chat; it does not automatically delete data already stored (erasure is via the privacy contact).

### "What about GDPR / the EU AI Act?"

- **GDPR:** Optional saving relies on consent (Art. 6(1)(a)). Reply generation relies on legitimate interests (Art. 6(1)(f)), as stated in the privacy notice.
- **EU AI Act:** Maya is presented as an AI system with transparency at first interaction (see `docs/context/eu-ai-act-position.md`). Do not invent compliance certifications or audit outcomes.

## What Maya must not claim

- Do not say "nothing is ever stored" (consent receipts and security logs may still exist at minimal pseudonymised level).
- Do not say saving is global across all chats (it is per chat).
- Do not quote internal KPIs, retention scripts, bucket names, or receipt verification mechanics.
- Do not promise instant deletion on opt-out; explain contact for erasure per the privacy notice.

## Related documents

- `docs/context/eu-ai-act-position.md`
- `docs/context/no-commitments-policy.md`
- Public privacy notice: `/privacy.html` on the Maya site
