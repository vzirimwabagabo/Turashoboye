# Rwanda Regulatory & Compliance Research Guide

This document records the statutory authorities, regulatory frameworks, verified requirements, and working assumptions governing animal-feed production and distribution in Rwanda.

---

## 1. Statutory Authorities & Mandates

### 1.1 Rwanda Inspectorate, Competition and Consumer Protection Authority (RICA)
- **Role:** Mandated to ensure quality and safety compliance in agriculture, animal feed, veterinary products, and food processing.
- **Specific Feed Responsibilities:**
  - Registration and licensing of animal-feed processing facilities.
  - Inspection of manufacturing premises for hygiene, rodent control, and equipment sanitation.
  - Verification that feeds do not contain banned substances, heavy metals, or mycotoxins (e.g. aflatoxins in maize/groundnuts).

### 1.2 Rwanda Standards Board (RSB)
- **Role:** National standards development, testing, and product certification.
- **Relevant Feed Standards:**
  - RS 281: Animal feedstuffs — Specification.
  - Standards for Poultry Feeds (Broiler Starter/Finisher, Layer Mash).
  - Standards for Pig Feeds and Dairy Cattle Concentrates.
- **Zamukana Ubuziranenge Program:**
  - Technical assistance program designed specifically for Rwandan SMEs and agro-processors to help them meet standards and qualify for the S-Mark (Standardization Mark).
  - Product registration required for animal-feed processors before marketing.

### 1.3 Rwanda Revenue Authority (RRA)
- **Tax Procedure Law & Retention:**
  - Mandates a **10-year statutory retention period** for business books of account, invoices, receipts, and supporting delivery documentation.
  - The 10-year timeline commences from the year following the fiscal year concerned.

### 1.4 Rwanda Development Board (RDB)
- **Enterprise Registration:**
  - Issuance of the company incorporation certificate and official Taxpayer Identification Number (TIN).

---

## 2. Software Architecture Translation

The platform enforces the following compliance rules:
1. **Configurable Compliance Records:** Stored in `regulatory_records` and `regulatory_documents`, categorised into company registration, premises licence, product registration, standards certification, and inspection records.
2. **Explicit Verification Workflow:** Records are marked `not_entered`, `pending_verification`, `verified`, or `expired`. Marking a record `verified` captures the responsible manager's user ID and source notes.
3. **Traceability Record Retention:** The system applies a 10-year baseline retention matching RRA rules, ensuring that batch tracking records remain accessible for inspection audits throughout their statutory life.
4. **Mycotoxin & Lab Safety Evidence:** Quality checks allow attaching lab certificates of analysis (COA) for incoming grain lots (e.g. aflatoxin test results).
