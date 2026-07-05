# Terminology & Product Language

## Overview

The product should consistently present itself as a platform where businesses **hire and manage AI employees**, not build AI agents.

This distinction is intentional.

Our target customers are business owners, not AI engineers. They already understand how to hire, manage, assign work to, and review employees. We should leverage that existing mental model instead of introducing technical AI terminology.

The product should feel like **building a team**, not configuring software.

---

# Core Terminology

| Use                  | Avoid                     |
| -------------------- | ------------------------- |
| Employee             | Agent                     |
| Hire Employee        | Create Agent              |
| Team                 | Agent Collection          |
| Role                 | Agent Template            |
| Assignment           | Workflow / Task Execution |
| Daily Report         | Execution Log             |
| Work Log             | Trace                     |
| Instructions         | Prompt                    |
| Experience           | Memory                    |
| Feedback             | Prompt Editing            |
| Working              | Running                   |
| Waiting for Approval | Pending Execution         |

---

# Mental Model

The product should answer the question:

> "What would it feel like if I had another employee working for me every day?"

Instead of:

> "What would it feel like to configure an AI agent?"

Employees should appear autonomous.

They wake up every morning, perform their responsibilities, prepare work for review, learn from feedback, and continue improving over time.

The user acts as the manager.

The employee is responsible for completing work.

---

# Roles vs Employees

A **Role** defines the job.

Examples:

* Lead Sourcer
* Recruiter
* Research Analyst
* Executive Assistant

An **Employee** is a specific instance of a role.

Example flow:

1. User clicks **Hire Employee**
2. User selects **Lead Sourcer**
3. The system creates an employee (for example, Emma)
4. Emma becomes part of the user's team

This mirrors real hiring:

You hire for a role, then a person fills that role.

---

# UI Copy Guidelines

Prefer language such as:

* Hire Employee
* Your Team
* Working
* Daily Report
* Assignments
* Performance
* Feedback
* Learned Today
* Waiting for Your Approval

Avoid technical AI terminology in the primary interface.

---

# Product Philosophy

Employees should feel like teammates rather than software.

The user should never feel like they are programming an AI.

Instead, they should feel like they are:

* hiring someone,
* giving them responsibilities,
* reviewing their work,
* coaching them through feedback,
* and watching them improve over time.

Every feature should reinforce this feeling.

When designing new functionality, ask:

> "Would a manager expect an employee to handle this autonomously, or would they expect the employee to ask for approval?"

If a good employee would make the decision independently, the product should automate it.

If a good employee would ask their manager before proceeding, the product should pause and request approval.

This principle should guide both the product experience and future feature development.
