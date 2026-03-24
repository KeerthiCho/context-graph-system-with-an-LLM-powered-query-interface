import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA_CONTEXT = `You are a data analyst assistant for an SAP Order-to-Cash (O2C) dataset. You ONLY answer questions about this dataset. If a user asks about anything unrelated (general knowledge, creative writing, coding help, etc.), respond: "This system is designed to answer questions related to the SAP O2C dataset only."

The dataset is stored as JSON with these entity collections:

1. sales_order_headers: salesOrder, salesOrderType, salesOrganization, distributionChannel, organizationDivision, soldToParty, creationDate, totalNetAmount, overallDeliveryStatus, overallOrdReltdBillgStatus, transactionCurrency, requestedDeliveryDate, customerPaymentTerms, totalCreditCheckStatus
2. sales_order_items: salesOrder, salesOrderItem, material, requestedQuantity, netAmount, materialGroup, productionPlant, storageLocation
3. sales_order_schedule_lines: salesOrder, salesOrderItem, scheduleLine, confirmedDeliveryDate, confdOrderQtyByMatlAvailCheck
4. outbound_delivery_headers: deliveryDocument, actualGoodsMovementDate, creationDate, overallGoodsMovementStatus, overallPickingStatus, shippingPoint
5. outbound_delivery_items: deliveryDocument, deliveryDocumentItem, actualDeliveryQuantity, plant, referenceSdDocument (links to salesOrder), referenceSdDocumentItem, storageLocation
6. billing_document_headers: billingDocument, billingDocumentType, creationDate, billingDocumentDate, totalNetAmount, transactionCurrency, companyCode, fiscalYear, accountingDocument, soldToParty, billingDocumentIsCancelled
7. billing_document_items: billingDocument, billingDocumentItem, material, billingQuantity, netAmount, referenceSdDocument (links to deliveryDocument), referenceSdDocumentItem
8. billing_document_cancellations: billingDocument, cancelledBillingDocument, totalNetAmount, soldToParty
9. journal_entry_items_accounts_receivable: companyCode, fiscalYear, accountingDocument, glAccount, referenceDocument (links to billingDocument), customer, amountInTransactionCurrency, postingDate
10. payments_accounts_receivable: companyCode, fiscalYear, accountingDocument, customer, invoiceReference (links to billingDocument), amountInTransactionCurrency, postingDate, salesDocument
11. business_partners: businessPartner, customer, businessPartnerFullName, businessPartnerName, industry
12. products: product, productType, productGroup, baseUnit, grossWeight, netWeight, division
13. product_descriptions: product, language, productDescription
14. plants: plant, plantName, salesOrganization

KEY RELATIONSHIPS (O2C Flow):
- Customer (business_partners.businessPartner) → Sales Order (sales_order_headers.soldToParty)
- Sales Order → Sales Order Items (salesOrder)
- Sales Order Items → Delivery Items (outbound_delivery_items.referenceSdDocument = salesOrder)
- Delivery Items → Delivery Headers (deliveryDocument)
- Delivery → Billing Items (billing_document_items.referenceSdDocument = deliveryDocument)
- Billing Items → Billing Headers (billingDocument)
- Billing → Journal Entry (journal_entry_items.referenceDocument = billingDocument)
- Billing → Payment (payments.invoiceReference = billingDocument)
- Sales Order Items → Product (material = product)

Graph node IDs use prefixes: BP_ (customer), SO_ (sales order), SOI_ (SO item), DLV_ (delivery), DLVI_ (delivery item), BIL_ (billing), BILI_ (billing item), JE_ (journal entry), PAY_ (payment), PRD_ (product), PLT_ (plant).

When answering:
1. Analyze the data thoroughly using the relationships above
2. Provide specific numbers, IDs, and details
3. Format answers in markdown with tables when showing multiple results
4. If your answer references specific entities, include their graph node IDs in a "highlightedNodes" array
5. Always ground your answers in the actual data structure`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Load the dataset
    const dataUrl = req.headers.get("origin") || "https://id-preview--96bc0785-3202-46b1-821f-f6553fb279bf.lovable.app";
    
    // Fetch the raw data to provide context
    let dataContext = "";
    try {
      const dataResp = await fetch(`${dataUrl}/sap_data.json`);
      if (dataResp.ok) {
        const sapData = await dataResp.json();
        // Include summary stats
        const stats: Record<string, number> = {};
        for (const [key, val] of Object.entries(sapData)) {
          stats[key] = (val as any[]).length;
        }
        dataContext = `\n\nDataset record counts: ${JSON.stringify(stats)}`;
        
        // Include sample data for context (first 3 records of key entities)
        const keyEntities = ['sales_order_headers', 'outbound_delivery_headers', 'billing_document_headers', 'business_partners', 'products', 'billing_document_items', 'outbound_delivery_items', 'payments_accounts_receivable', 'journal_entry_items_accounts_receivable'];
        for (const entity of keyEntities) {
          if (sapData[entity]) {
            dataContext += `\n\n${entity} (first 5 records): ${JSON.stringify(sapData[entity].slice(0, 5))}`;
          }
        }
        
        // For certain query patterns, include all relevant data
        const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
        if (lastUserMsg.includes("product") || lastUserMsg.includes("material")) {
          dataContext += `\n\nAll products: ${JSON.stringify(sapData['products'])}`;
          dataContext += `\n\nAll product_descriptions: ${JSON.stringify(sapData['product_descriptions'])}`;
        }
        if (lastUserMsg.includes("customer") || lastUserMsg.includes("partner")) {
          dataContext += `\n\nAll business_partners: ${JSON.stringify(sapData['business_partners'])}`;
        }
        if (lastUserMsg.includes("billing") || lastUserMsg.includes("invoice") || lastUserMsg.includes("bill")) {
          dataContext += `\n\nAll billing_document_headers: ${JSON.stringify(sapData['billing_document_headers'])}`;
          dataContext += `\n\nAll billing_document_items: ${JSON.stringify(sapData['billing_document_items'])}`;
        }
        if (lastUserMsg.includes("delivery") || lastUserMsg.includes("deliver")) {
          dataContext += `\n\nAll outbound_delivery_headers: ${JSON.stringify(sapData['outbound_delivery_headers'])}`;
          dataContext += `\n\nAll outbound_delivery_items: ${JSON.stringify(sapData['outbound_delivery_items'])}`;
        }
        if (lastUserMsg.includes("order") || lastUserMsg.includes("sales")) {
          dataContext += `\n\nAll sales_order_headers: ${JSON.stringify(sapData['sales_order_headers'])}`;
          dataContext += `\n\nAll sales_order_items: ${JSON.stringify(sapData['sales_order_items'])}`;
        }
        if (lastUserMsg.includes("payment") || lastUserMsg.includes("pay")) {
          dataContext += `\n\nAll payments: ${JSON.stringify(sapData['payments_accounts_receivable'])}`;
        }
        if (lastUserMsg.includes("trace") || lastUserMsg.includes("flow") || lastUserMsg.includes("broken") || lastUserMsg.includes("incomplete")) {
          // For flow tracing, include all key linking data
          dataContext += `\n\nAll sales_order_headers: ${JSON.stringify(sapData['sales_order_headers'])}`;
          dataContext += `\n\nAll sales_order_items: ${JSON.stringify(sapData['sales_order_items'])}`;
          dataContext += `\n\nAll outbound_delivery_items: ${JSON.stringify(sapData['outbound_delivery_items'])}`;
          dataContext += `\n\nAll billing_document_items: ${JSON.stringify(sapData['billing_document_items'])}`;
          dataContext += `\n\nAll billing_document_headers: ${JSON.stringify(sapData['billing_document_headers'])}`;
          dataContext += `\n\nAll journal_entry_items: ${JSON.stringify(sapData['journal_entry_items_accounts_receivable'])}`;
          dataContext += `\n\nAll payments: ${JSON.stringify(sapData['payments_accounts_receivable'])}`;
        }
      }
    } catch (e) {
      console.error("Failed to fetch data context:", e);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SCHEMA_CONTEXT + dataContext + '\n\nIMPORTANT: Return your response as JSON with two fields: "reply" (markdown string) and "highlightedNodes" (array of graph node ID strings like "SO_123", "BIL_456"). Always return valid JSON.' },
          ...messages,
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ reply: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ reply: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { reply: content, highlightedNodes: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graph-query error:", e);
    return new Response(
      JSON.stringify({ reply: "An error occurred. Please try again.", highlightedNodes: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
