# Security Policy

## Security Measures Implemented

### Authentication & Authorization
- ✅ **Supabase Auth** - Industry-standard authentication service
- ✅ **Row Level Security (RLS)** - Database-level access control on all tables
- ✅ **Session Management** - Automatic session handling via Supabase
- ✅ **Password Requirements** - Minimum 8 characters enforced

### Data Protection
- ✅ **Environment Variables** - Secrets stored in `.env` (not committed to git)
- ✅ **sessionStorage for Invite Codes** - Temporary storage cleared on tab close
- ✅ **HTTPS-only** - All Supabase connections use secure HTTPS
- ✅ **Parameterized Queries** - No SQL injection vulnerabilities

### Input Validation
- ✅ **Zod Schema Validation** - Email and password validation
- ✅ **Email Format Validation** - RFC-compliant email checking
- ✅ **Trim User Input** - Whitespace automatically removed

### Dependencies
- ✅ **Regular Security Audits** - Dependencies checked for vulnerabilities
- ✅ **Up-to-date Packages** - All known vulnerabilities patched
- ✅ **Lock Files** - Consistent dependency versions across environments

## Database Security (Row Level Security Policies)

### Groups Table
- Users can only view groups they are members of or admin
- Only authenticated users can create groups
- Only group admins can update/delete their groups

### Group Memberships Table
- Users can only view their own memberships
- Users can only join groups (INSERT) for themselves
- Users can leave groups (DELETE) they're in

### Profiles Table
- Users can only view and update their own profile
- Nicknames are required before accessing the app

## Best Practices for Developers

### Environment Variables
1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys if exposed** - If keys are accidentally committed, rotate immediately
3. **Use different keys for dev/prod** - Separate Supabase projects recommended

### API Key Security
- The `VITE_SUPABASE_PUBLISHABLE_KEY` is **safe to expose** in client code
- It's protected by RLS policies on the database
- The secret key is **never** exposed to the client

### Invite Code Security
- 8-character alphanumeric codes (36^8 = 2.8 trillion combinations)
- Stored in sessionStorage (cleared on tab close)
- Rate limiting recommended but not yet implemented

## Known Limitations & Recommendations

### ⚠️ Rate Limiting (Not Implemented)
**Risk:** Invite code lookups could theoretically be brute-forced
**Recommendation:** Implement rate limiting via:
- Supabase Edge Functions
- Database-level attempt tracking
- IP-based throttling

**Mitigation:** The 36^8 keyspace makes brute force impractical without significant resources

### ⚠️ Email Verification (Optional)
**Current:** Supabase Auth handles email verification
**Recommendation:** Ensure email verification is enabled in Supabase dashboard

### ⚠️ Password Strength
**Current:** Minimum 8 characters
**Recommendation:** Consider enforcing:
- At least one uppercase letter
- At least one number
- At least one special character

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please:
1. **Do NOT** open a public GitHub issue
2. Email the repository owner privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within 48 hours and work to patch critical issues immediately.

## Security Checklist for Deployment

Before deploying to production:

- [ ] Rotate all Supabase keys
- [ ] Enable email verification in Supabase
- [ ] Set up monitoring and alerts
- [ ] Configure CORS properly
- [ ] Enable Supabase RLS on all tables
- [ ] Review and test all RLS policies
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable HTTPS redirect (handled by hosting provider)
- [ ] Set appropriate Content Security Policy headers
- [ ] Configure rate limiting (if possible)

## Security Updates

This project is regularly audited for security issues. All dependencies are kept up-to-date, and security patches are applied promptly.

Last security audit: December 31, 2025
Last dependency update: December 31, 2025

---

**Security is a shared responsibility.** If you notice any security concerns, please report them immediately.
