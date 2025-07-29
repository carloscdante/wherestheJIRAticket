# Where's the JIRA Ticket? 🎫

A utility for engineers who want to work fast and freeform, without getting asked "where's the story?" or "where's the ticket?" Because that's annoying as hell.

## Why? 🤔

This is a bit of a self-explanatory project. It came along out of pure frustration with wanting to push fixes and always having to describe my changes in some sort of convoluted planning way, when I know exactly what to make/what to code but never what exactly to say on the JIRA ticket or story. "Why not infer that from the diff so people can stop asking me where's the ticket?" I thought. Well, LLMs sure make that easy. I don't really care much about hallucinations because what I write on a story does not capture the full picture of the diff anyway, so... yeah. It makes my job faster, and I hope it can make yours faster too.

## Installation

```bash
npm install -g wheres-the-jira
```

## Setup

```bash
cd your-project
wtj
```

Pick JIRA or Shortcut. Enter your credentials. That's it.

## How it works

1. You code whatever you want
2. You commit with normal messages like "fixed that stupid bug" or "whatever"
3. You push
4. The hook reads your commits and diff
5. AI figures out what corporate-speak title and description to generate
6. Creates the ticket automatically
7. Renames your branch to include the ticket ID
8. Your manager is happy, you never had to open JIRA

## What you need

- Node.js 14+
- OpenAI API key (for the AI part)
- JIRA or Shortcut account
- A healthy disdain for process theater

## Configuration

Config goes in `.wtj-config.json`. Don't commit it.

### For JIRA
- Your company's Atlassian URL
- Email + API token
- Project key (that annoying uppercase thing)
- Sprint ID if you care about that

### For Shortcut
- API token
- Project ID
- Whatever other ceremony they require

## Example

```bash
git checkout -b fix-that-annoying-thing
# hack hack hack
git commit -m "fixed the thing"
git push

# Output:
# Creating JIRA issue...
# Done. PROJ-1234 created.
# Branch renamed to PROJ-1234-fix-that-annoying-thing
```

Now when someone asks "where's the JIRA?" you can point to the branch name.

## License

GPLv3. Use it however you want, but commit what you change.
