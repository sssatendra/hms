# Laboratory Order Lifecycle

This document outlines the statuses and transitions of a Lab Order in the HMS.

## Lifecycle Statuses

| Status | Description | Actor |
|--------|-------------|-------|
| **PENDING** | Order has been created by a Doctor. | Doctor |
| **SAMPLE_COLLECTED** | Patient's sample has been collected by the Lab Technician. | Lab Tech / Admin |
| **IN_PROGRESS** | The sample is being processed in the laboratory. | Lab Tech / Admin |
| **COMPLETED** | Results have been synced and the order is finalized. | Lab Tech / Admin |
| **CANCELLED** | The order has been cancelled. | Doctor / Admin |

## Workflow Stages

### 1. Creation
A **Doctor** searches for a patient and selects required tests in the **New Lab Order** page. The order is created with a `PENDING` status.

### 2. Sample Collection
The **Lab Technician** or **Admin** sees the pending order on the dashboard. They click **Collect Sample**, which updates the status to `SAMPLE_COLLECTED`.

### 3. Processing
Once the lab work begins, the actor clicks **Start Processing**. The status moves to `IN_PROGRESS`.

### 4. Result Entry & Sync
The actor enters numeric or qualitative results for each test item in the **Order Details** modal. Clicking **Sync Results** saves the findings.

### 5. Completion
After results are synced, the order can be marked as `COMPLETED`. This makes the results available to the ordering Physician.

## Permissions
- `lab:read`: Can view orders and stats.
- `lab:write`: Can create new orders.
- `lab:process`: Can transition order statuses (Collect Sample, Process, Complete).
- `lab:upload`: Can upload external reports or images.
