# Coding Standards - TypeScript/JavaScript

## 1. Purpose
This document defines coding standards for the GAAR ERP System to ensure code consistency, readability, and maintainability.

## 2. Scope
Applies to all source code written in:
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)

## 3. General Principles
- **Readability:** Code should be easy to read and understand
- **Maintainability:** Code should be easy to modify and extend
- **Consistency:** Follow established patterns and conventions
- **Simplicity:** Prefer simple solutions over complex ones
- **Performance:** Write efficient code without sacrificing readability

## 4. Naming Conventions

### 4.1 Files
- Use kebab-case for file names: `user-profile.tsx`
- Use PascalCase for component files: `UserProfile.tsx`
- Use camelCase for utility files: `formatDate.ts`

### 4.2 Variables
- Use camelCase: `userName`, `isActive`
- Use descriptive names: `employeeCount` not `cnt`
- Boolean variables should start with `is`, `has`, `should`: `isValid`, `hasPermission`

### 4.3 Functions
- Use camelCase: `getUserById()`, `calculateTotal()`
- Use verb-noun pattern: `fetchEmployees()`, `saveUser()`
- Use descriptive names: `validateEmail()` not `check()`

### 4.4 Classes/Components
- Use PascalCase: `UserProfile`, `PaymentForm`
- Component names should be descriptive: `EmployeeTable` not `Table`

### 4.5 Constants
- Use UPPER_SNAKE_CASE: `MAX_RETRIES`, `API_BASE_URL`

### 4.6 Interfaces/Types
- Use PascalCase: `User`, `PaymentInfo`
- Use descriptive names: `CreateUserInput` not `Input`

## 5. Code Structure

### 5.1 Imports
```typescript
// 1. External libraries
import { useState } from "react";
import { NextRequest, NextResponse } from "next/server";

// 2. Internal aliases
import connectDB from "@/lib/mongoose";
import { requireAuth } from "@/lib/apiGuard";

// 3. Relative imports
import User from "@/models/User";

// 4. Types
import type { User } from "@/types/user";
```

### 5.2 File Organization
```
Component/
├── Component.tsx           # Main component
├── Component.test.tsx      # Tests
├── Component.types.ts      # Type definitions
├── Component.utils.ts      # Utility functions
└── index.ts               # Exports
```

## 6. TypeScript Standards

### 6.1 Type Annotations
- Use TypeScript strict mode
- Define interfaces for all objects
- Use type inference when obvious
- Avoid `any` type

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// Bad
const getUser = (id: any): Promise<any> => {
  // ...
};
```

### 6.2 Type Safety
- Use `unknown` instead of `any` when type is unknown
- Use type guards for type narrowing
- Use discriminated unions for complex types

## 7. React/Next.js Standards

### 7.1 Component Structure
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component definition
// 4. Hooks
// 5. Event handlers
// 6. Render logic
// 7. Styles
// 8. Exports
```

### 7.2 Hooks
- Use functional components with hooks
- Custom hooks should start with `use`: `useAuth()`, `useForm()`
- Follow React hooks rules

### 7.3 State Management
- Use `useState` for local state
- Use Context for global state
- Use SWR/React Query for server state

## 8. API Route Standards

### 8.1 Route Structure
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Authentication
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  // 2. Authorization
  // ... check permissions

  // 3. Validation
  // ... validate input

  // 4. Business logic
  // ... execute operation

  // 5. Response
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  // Similar structure
}
```

### 8.2 Error Handling
- Use try-catch blocks
- Return appropriate HTTP status codes
- Log errors with context
- Return user-friendly error messages

## 9. Database Standards

### 9.1 Model Definition
```typescript
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"],
  },
});

// Indexes
UserSchema.index({ orgId: 1, username: 1 });
```

### 9.2 Queries
- Use lean() for read-only queries
- Use select() to limit fields
- Always use pagination
- Use proper indexes

## 10. Security Standards

### 10.1 Authentication
- Use NextAuth.js for authentication
- Verify JWT tokens on all protected routes
- Use secure cookies
- Implement rate limiting

### 10.2 Authorization
- Check user permissions
- Implement org-scoping
- Prevent horizontal privilege escalation
- Log all sensitive operations

### 10.3 Input Validation
- Validate all user inputs
- Sanitize data before database operations
- Prevent SQL injection
- Prevent XSS attacks

### 10.4 Sensitive Data
- Never log passwords or tokens
- Encrypt sensitive data
- Use environment variables for secrets
- Rotate secrets regularly

## 11. Comments and Documentation

### 11.1 When to Comment
- Explain complex algorithms
- Document workarounds
- Note security considerations
- Explain business rules

### 11.2 When NOT to Comment
- Obvious code
- Self-documenting code
- Redundant comments

### 11.3 JSDoc Format
```typescript
/**
 * Calculates the total amount including tax.
 * @param amount - The base amount
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total amount including tax
 */
function calculateTotal(amount: number, taxRate: number): number {
  return amount * (1 + taxRate);
}
```

## 12. Error Handling

### 12.1 Error Types
- Use custom error classes
- Distinguish between expected and unexpected errors
- Provide meaningful error messages

### 12.2 Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  console.error("Operation failed:", error);
  // Handle error appropriately
  throw new Error("User-friendly message");
}
```

## 13. Performance

### 13.1 Best Practices
- Avoid unnecessary re-renders
- Use memoization appropriately
- Implement pagination for large datasets
- Use indexes for database queries
- Cache frequently accessed data

### 13.2 Code Splitting
- Use dynamic imports for large components
- Lazy load non-critical components
- Optimize bundle size

## 14. Testing

### 14.1 Test Structure
- Write tests alongside code
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### 14.2 Test Coverage
- Aim for >80% code coverage
- Cover critical paths
- Test edge cases
- Test error scenarios

## 15. Git Standards

### 15.1 Commit Messages
- Use conventional commits format
- First line: summary (50 chars max)
- Body: detailed explanation
- Footer: issue references

```
feat: add user profile update

- Allow users to update name, phone, email
- Add validation for required fields
- Update API endpoint

Closes #123
```

### 15.2 Branch Naming
- `feature/user-profile-update`
- `bugfix/login-validation`
- `hotfix/production-issue`
- `release/v1.2.0`

## 16. Code Review Checklist
- [ ] Code follows coding standards
- [ ] Logic is correct
- [ ] Error handling implemented
- [ ] Tests included
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] No console.log statements
- [ ] No commented-out code
