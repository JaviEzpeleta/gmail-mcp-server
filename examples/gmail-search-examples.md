# Gmail Search Query Examples

This file contains examples of Gmail search queries that you can use with the `search_emails` and `list_emails` tools.

## Basic Search Queries

### By Sender
```
from:john@example.com
from:support@company.com
from:"John Smith"
```

### By Subject
```
subject:invoice
subject:"Meeting Tomorrow"
subject:urgent
```

### By Recipients
```
to:me
to:team@company.com
cc:manager@company.com
```

## Advanced Search Queries

### By Date
```
newer_than:2d          # Emails from last 2 days
older_than:1w          # Emails older than 1 week
after:2024/1/1         # After January 1, 2024
before:2024/12/31      # Before December 31, 2024
```

### By Content
```
has:attachment         # Emails with attachments
filename:pdf           # PDFs attached
"important meeting"    # Exact phrase
budget OR invoice      # Either word
```

### By Labels and Categories
```
label:important
label:work
category:promotions
category:social
is:starred
is:unread
```

### By Size
```
size:5M               # Larger than 5MB
smaller:1M            # Smaller than 1MB
```

## Complex Combined Queries

### Work-related unread emails
```
from:company.com is:unread label:work
```

### Recent important emails with attachments
```
is:important has:attachment newer_than:1w
```

### Emails from specific domain excluding newsletters
```
from:example.com -label:newsletters
```

### Meeting invitations from last week
```
subject:meeting newer_than:1w has:attachment
```

### All emails from team members
```
from:alice@company.com OR from:bob@company.com OR from:charlie@company.com
```

## Usage Examples with MCP Tools

### List Emails with Query
Ask Claude:
> "List my 5 most recent unread emails from work"

This uses: `list_emails` with query `"from:company.com is:unread"` and maxResults `5`

### Search for Specific Emails
Ask Claude:
> "Search for emails about invoices from the last month"

This uses: `search_emails` with query `"subject:invoice newer_than:1m"`

### Find Emails with Attachments
Ask Claude:
> "Show me emails with PDF attachments from this week"

This uses: `search_emails` with query `"has:attachment filename:pdf newer_than:1w"`

## Tips for Better Searches

1. **Use quotes** for exact phrases: `"project update"`
2. **Combine multiple criteria** with AND (implicit) or OR
3. **Exclude results** with minus sign: `-label:spam`
4. **Use wildcards** with asterisk: `test*` matches "test", "testing", "tests"
5. **Case insensitive** - queries work regardless of case

## Common Search Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `from:` | From specific sender | `from:boss@company.com` |
| `to:` | To specific recipient | `to:team@company.com` |
| `subject:` | Subject contains | `subject:meeting` |
| `has:` | Has attachment/feature | `has:attachment` |
| `is:` | Email status | `is:unread`, `is:starred` |
| `label:` | Gmail label | `label:important` |
| `category:` | Gmail category | `category:primary` |
| `filename:` | Attachment filename | `filename:report.pdf` |
| `size:` | Email size | `size:5M` (larger than 5MB) |
| `newer_than:` | Newer than timeframe | `newer_than:2d` |
| `older_than:` | Older than timeframe | `older_than:1w` |
| `after:` | After specific date | `after:2024/1/1` |
| `before:` | Before specific date | `before:2024/12/31` |

## Time Units

- `d` = days
- `w` = weeks  
- `m` = months
- `y` = years

Examples: `1d`, `2w`, `3m`, `1y`