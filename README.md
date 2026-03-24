# 📊 Graph-Based Data Modeling and Query System

## 🚀 Overview

This project transforms fragmented business data into a **graph-based system with an LLM-powered query interface**.

It enables users to:
- Explore relationships between entities visually
- Ask questions in natural language
- Receive accurate, data-backed responses

The system bridges the gap between structured databases and intuitive data exploration.

---

## 🧠 Problem Statement

In traditional systems, data is spread across multiple tables such as:
- Orders
- Deliveries
- Invoices
- Payments

This makes it difficult to:
- Trace end-to-end flows
- Identify inconsistencies
- Answer complex business questions

---

## 💡 Solution

This system converts relational data into a **contextual graph** and integrates a **natural language interface** powered by an LLM.

### Key Capabilities:
- Graph-based representation of business entities
- Interactive visualization of relationships
- Natural language query → structured query (SQL)
- Data-backed responses (no hallucination)

---

## 🏗️ Architecture

### 1. Data Layer
- Input dataset (CSV files)
- Preprocessed and normalized

### 2. Storage Layer
- Relational database (SQLite / PostgreSQL)
- Stores structured data with defined relationships

### 3. Graph Layer
- Entities modeled as nodes
- Relationships modeled as edges

Example:
Customer → Order → Delivery → Invoice → Payment

---

### 4. Backend (FastAPI)

Responsibilities:
- Query execution
- LLM interaction
- Data processing

Endpoints:
- `/query` → Accepts user query and returns response
- `/graph` → Returns graph data for visualization

---

### 5. LLM Layer

- Converts natural language → SQL queries
- Uses schema-aware prompting

Workflow:
User Query → LLM → SQL → Database → Result → Response

---

### 6. Frontend (React)

Features:
- Graph visualization (React Flow / Cytoscape.js)
- Chat interface
- Interactive exploration of nodes and relationships

---

## 🔗 Graph Modeling

### Nodes:
- Orders
- Deliveries
- Invoices
- Payments
- Customers
- Products

### Relationships:
- Customer → places → Order
- Order → contains → Product
- Order → fulfilled_by → Delivery
- Delivery → billed_as → Invoice
- Invoice → paid_by → Payment

---

## 💬 Conversational Query System

Users can ask questions like:

- "Which products have the highest number of invoices?"
- "Show orders that are delivered but not billed"
- "Trace the flow of a billing document"

### Process:
1. Parse user query
2. Generate SQL using LLM
3. Execute query
4. Return structured response

---

## 🛡️ Guardrails

To ensure safe and relevant usage:

- Restricts queries to dataset domain
- Rejects unrelated questions

Example:
> "This system is designed to answer questions related to the dataset only."

- Optional query validation before execution

---

## ⚙️ Tech Stack

### Backend:
- Python
- FastAPI

### Database:
- SQLite / PostgreSQL

### Graph:
- NetworkX / Neo4j (optional)

### Frontend:
- React
- React Flow / Cytoscape.js

### LLM:
- Groq / Gemini / OpenRouter

---

## 🧪 Example Queries

1. Which products are associated with the highest number of billing documents?

2. Trace the full flow of a billing document.

3. Identify orders with incomplete flows (delivered but not billed).

---

## 🔍 Design Decisions

### Why SQL over Graph DB?
- Faster to implement
- Easier LLM integration
- Sufficient for structured querying

### Why Graph Layer?
- Improves relationship visibility
- Enables intuitive exploration

### Why LLM?
- Converts natural language into actionable queries
- Makes system accessible to non-technical users

---

## ⚡ Challenges & Solutions

| Challenge | Solution |
|----------|--------|
| Incorrect SQL generation | Improved prompt structure |
| Missing relationships | Refined schema design |
| Hallucinated answers | Enforced data-backed responses |
| Off-topic queries | Implemented guardrails |

---

## 📈 Possible Improvements

- Highlight graph nodes based on query results
- Add conversation memory
- Hybrid semantic + structured search
- Advanced graph analytics (clustering, centrality)

---

## ▶️ Running the Project

### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
