# Code Review Process

## 1. Purpose
This document defines the code review process to ensure code quality, knowledge sharing, and adherence to coding standards.

## 2. Scope
Applies to all code changes including:
- New features
- Bug fixes
- Refactoring
- Configuration changes
- Documentation updates

## 3. Review Types

### 3.1 Standard Review
- **When:** All non-trivial code changes
- **Reviewers:** Minimum 1, maximum 3
- **Turnaround:** Within 24 hours

### 3.2 Expedited Review
- **When:** Critical bug fixes, hotfixes
- **Reviewers:** Minimum 1 senior developer
- **Turnaround:** Within 4 hours

### 3.3 Architecture Review
- **When:** Major architectural changes
- **Reviewers:** Tech lead + 2 senior developers
- **Turnaround:** Within 48 hours

## 4. Review Process

### 4.1 Before Review
1. Author ensures:
   - Code compiles without errors
   - Tests pass locally
   - Code follows standards
   - Self-review completed

2. Author creates pull request:
   - Clear title and description
   - Links to issue/ticket
   - Screenshots for UI changes
   - Test instructions

### 4.2 During Review
1. Automated checks run:
   - Linting
   - Type checking
   - Unit tests
   - Code coverage

2. Reviewer examines:
   - Code logic and correctness
   - Adherence to standards
   - Test coverage
   - Security considerations
   - Performance implications

3. Reviewer provides:
   - Approval
   - Requested changes
   - Comments/questions

### 4.3 After Review
1. Author addresses feedback
2. Re-request review if needed
3. Merge when approved
4. Delete feature branch

## 5. Review Checklist

### 5.1 Code Quality
- [ ] Code is readable and maintainable
- [ ] Naming conventions followed
- [ ] Functions are small and focused
- [ ] No code duplication (DRY principle)
- [ ] No commented-out code
- [ ] No console.log statements

### 5.2 Functionality
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Input validation present
- [ ] Output is correct

### 5.3 Testing
- [ ] Unit tests included
- [ ] Test coverage >80%
- [ ] Tests cover edge cases
- [ ] Tests are meaningful
- [ ] All tests pass

### 5.4 Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization correct
- [ ] Sensitive data not exposed
- [ ] Input sanitized

### 5.5 Performance
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Pagination implemented where needed
- [ ] Caching considered

### 5.6 Documentation
- [ ] Code comments where needed
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Migration guide if needed

## 6. Review Guidelines

### 6.1 For Authors
- Be open to feedback
- Respond to all comments
- Ask questions if unclear
- Make requested changes promptly
- Thank reviewers for their time

### 6.2 For Reviewers
- Be respectful and constructive
- Explain reasoning for changes
- Distinguish between must-fix and nice-to-have
- Approve when satisfied
- Provide timely feedback

### 6.3 Review Comments
- Use clear, specific language
- Suggest alternatives when rejecting
- Prioritize feedback (P1, P2, P3)
- Distinguish between blocking and non-blocking

## 7. Merge Criteria
- All automated checks pass
- All blocking comments resolved
- Minimum approvals received
- No merge conflicts
- Up-to-date with target branch

## 8. Post-Merge
- Author verifies deployment
- Author monitors for issues
- Author updates documentation if needed
- Team is notified of significant changes

## 9. Tools
- **Version Control:** Git
- **Code Review:** GitHub/GitLab PR
- **CI/CD:** Automated checks
- **Static Analysis:** ESLint, Prettier
- **Coverage:** Vitest coverage reports

## 10. Metrics
- Review turnaround time
- Number of review cycles
- Defect escape rate
- Code coverage trends

## 11. Roles and Responsibilities

### 11.1 Author
- Prepare code for review
- Respond to feedback
- Make required changes
- Merge when approved

### 11.2 Reviewer
- Review code thoroughly
- Provide constructive feedback
- Approve or request changes
- Ensure standards are met

### 11.3 Tech Lead
- Review critical changes
- Resolve disputes
- Ensure process adherence
- Mentor team members
