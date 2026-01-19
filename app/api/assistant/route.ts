import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AssistantAction = "compose" | "rephrase" | "translate";
type AssistantLocale = "fr" | "en" | "de";
type ComposeType = "invoice_followup" | "quote_send" | "payment_reminder" | "generic";

const localeToIntl: Record<AssistantLocale, string> = {
  fr: "fr-FR",
  en: "en-US",
  de: "de-DE",
};

const languageNames: Record<AssistantLocale, string> = {
  fr: "French",
  en: "English",
  de: "German",
};

const defaultSubjects: Record<AssistantLocale, Record<ComposeType, string>> = {
  fr: {
    invoice_followup: "Relance de facture",
    quote_send: "Envoi de devis",
    payment_reminder: "Rappel de paiement",
    generic: "Message administratif",
  },
  en: {
    invoice_followup: "Invoice follow-up",
    quote_send: "Quote delivery",
    payment_reminder: "Payment reminder",
    generic: "Administrative email",
  },
  de: {
    invoice_followup: "Rechnungsnachverfolgung",
    quote_send: "Angebotsversand",
    payment_reminder: "Zahlungserinnerung",
    generic: "Verwaltungsmail",
  },
};

function formatAmount(amount?: number, currency?: string, locale: AssistantLocale = "fr") {
  if (amount == null || Number.isNaN(amount)) return "";
  try {
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: currency || "CHF",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency || "CHF"}`;
  }
}

function formatDate(value?: string | null, locale: AssistantLocale = "fr") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(localeToIntl[locale]);
}

function buildFallbackEmail({
  language,
  composeType,
  context,
}: {
  language: AssistantLocale;
  composeType: ComposeType;
  context?: any;
}) {
  const clientName = context?.client?.nom || context?.client?.name || "";
  const documentNumber = context?.document?.numero || "";
  const dueDate = formatDate(context?.document?.dateEcheance, language);
  const amount = formatAmount(context?.document?.montant, context?.document?.currency, language);

  const greetings: Record<AssistantLocale, string> = {
    fr: "Bonjour",
    en: "Hello",
    de: "Guten Tag",
  };
  const closing: Record<AssistantLocale, string> = {
    fr: "Cordialement",
    en: "Best regards",
    de: "Mit freundlichen Grüßen",
  };

  let subject = defaultSubjects[language][composeType];
  let body = "";

  if (composeType === "invoice_followup") {
    if (language === "fr") {
      subject = `Relance facture ${documentNumber ? `n°${documentNumber}` : ""}`.trim();
      body = `${greetings.fr} ${clientName ? clientName : ""},\n\n` +
        `Nous vous rappelons que la facture ${documentNumber ? `n°${documentNumber}` : ""} ${
          amount ? `d’un montant de ${amount}` : ""
        } arrive à échéance${dueDate ? ` le ${dueDate}` : ""}.\n` +
        "Pouvez-vous nous confirmer la date de règlement ?\n\n" +
        `${closing.fr},\n`;
    } else if (language === "en") {
      subject = `Invoice follow-up${documentNumber ? ` #${documentNumber}` : ""}`.trim();
      body = `${greetings.en} ${clientName ? clientName : ""},\n\n` +
        `This is a reminder regarding invoice ${documentNumber ? `#${documentNumber}` : ""} ${
          amount ? `for ${amount}` : ""
        }${dueDate ? ` due on ${dueDate}` : ""}.\n` +
        "Could you please confirm the expected payment date?\n\n" +
        `${closing.en},\n`;
    } else {
      subject = `Rechnungsnachverfolgung${documentNumber ? ` Nr. ${documentNumber}` : ""}`.trim();
      body = `${greetings.de} ${clientName ? clientName : ""},\n\n` +
        `wir möchten an die Rechnung ${documentNumber ? `Nr. ${documentNumber}` : ""} ${
          amount ? `über ${amount}` : ""
        }${dueDate ? ` fällig am ${dueDate}` : ""} erinnern.\n` +
        "Könnten Sie uns den voraussichtlichen Zahlungstermin bestätigen?\n\n" +
        `${closing.de},\n`;
    }
  } else if (composeType === "quote_send") {
    if (language === "fr") {
      subject = `Envoi devis ${documentNumber ? `n°${documentNumber}` : ""}`.trim();
      body = `${greetings.fr} ${clientName ? clientName : ""},\n\n` +
        `Veuillez trouver ci-joint notre devis ${documentNumber ? `n°${documentNumber}` : ""} ${
          amount ? `pour un montant de ${amount}` : ""
        }.\n` +
        "N’hésitez pas à revenir vers nous pour toute question.\n\n" +
        `${closing.fr},\n`;
    } else if (language === "en") {
      subject = `Quote delivery${documentNumber ? ` #${documentNumber}` : ""}`.trim();
      body = `${greetings.en} ${clientName ? clientName : ""},\n\n` +
        `Please find our quote ${documentNumber ? `#${documentNumber}` : ""} ${
          amount ? `for ${amount}` : ""
        } attached.\n` +
        "Let us know if you have any questions.\n\n" +
        `${closing.en},\n`;
    } else {
      subject = `Angebotsversand${documentNumber ? ` Nr. ${documentNumber}` : ""}`.trim();
      body = `${greetings.de} ${clientName ? clientName : ""},\n\n` +
        `anbei finden Sie unser Angebot ${documentNumber ? `Nr. ${documentNumber}` : ""} ${
          amount ? `über ${amount}` : ""
        }.\n` +
        "Bei Fragen stehen wir gerne zur Verfügung.\n\n" +
        `${closing.de},\n`;
    }
  } else if (composeType === "payment_reminder") {
    if (language === "fr") {
      subject = `Rappel de paiement${documentNumber ? ` - facture n°${documentNumber}` : ""}`.trim();
      body = `${greetings.fr} ${clientName ? clientName : ""},\n\n` +
        `Nous n’avons pas encore reçu le règlement de la facture ${
          documentNumber ? `n°${documentNumber}` : ""
        } ${amount ? `(${amount})` : ""}.` +
        `${dueDate ? ` L’échéance était fixée au ${dueDate}.` : ""}\n` +
        "Merci de nous indiquer quand le paiement sera effectué.\n\n" +
        `${closing.fr},\n`;
    } else if (language === "en") {
      subject = `Payment reminder${documentNumber ? ` - invoice #${documentNumber}` : ""}`.trim();
      body = `${greetings.en} ${clientName ? clientName : ""},\n\n` +
        `We have not yet received payment for invoice ${
          documentNumber ? `#${documentNumber}` : ""
        } ${amount ? `(${amount})` : ""}.` +
        `${dueDate ? ` The due date was ${dueDate}.` : ""}\n` +
        "Please let us know when the payment will be completed.\n\n" +
        `${closing.en},\n`;
    } else {
      subject = `Zahlungserinnerung${documentNumber ? ` - Rechnung Nr. ${documentNumber}` : ""}`.trim();
      body = `${greetings.de} ${clientName ? clientName : ""},\n\n` +
        `wir haben die Zahlung für die Rechnung ${documentNumber ? `Nr. ${documentNumber}` : ""} ${
          amount ? `(${amount})` : ""
        } bisher nicht erhalten.` +
        `${dueDate ? ` Das Fälligkeitsdatum war der ${dueDate}.` : ""}\n` +
        "Bitte teilen Sie uns mit, wann die Zahlung erfolgt.\n\n" +
        `${closing.de},\n`;
    }
  } else {
    if (language === "fr") {
      body = `${greetings.fr} ${clientName ? clientName : ""},\n\n` +
        "Je vous contacte au sujet de votre dossier administratif.\n\n" +
        `${closing.fr},\n`;
    } else if (language === "en") {
      body = `${greetings.en} ${clientName ? clientName : ""},\n\n` +
        "I am reaching out regarding your administrative request.\n\n" +
        `${closing.en},\n`;
    } else {
      body = `${greetings.de} ${clientName ? clientName : ""},\n\n` +
        "ich melde mich bezüglich Ihrer administrativen Anfrage.\n\n" +
        `${closing.de},\n`;
    }
  }

  return { subject, body };
}

function ensureGreetingAndClosing(text: string, language: AssistantLocale) {
  const greetings: Record<AssistantLocale, string> = {
    fr: "Bonjour,",
    en: "Hello,",
    de: "Guten Tag,",
  };
  const closings: Record<AssistantLocale, string> = {
    fr: "Cordialement,",
    en: "Best regards,",
    de: "Mit freundlichen Grüßen,",
  };

  const lines = text.trim();
  let result = lines;
  if (!lines.toLowerCase().startsWith(greetings[language].toLowerCase().slice(0, 5))) {
    result = `${greetings[language]}\n\n${result}`;
  }
  if (!lines.toLowerCase().includes(closings[language].toLowerCase().slice(0, 6))) {
    result = `${result}\n\n${closings[language]}`;
  }
  return result;
}

function fallbackRephrase(input: string, tone: string, language: AssistantLocale) {
  let text = input.trim();
  if (!text) return text;
  if (tone === "firm") {
    text = `${text}\n\n${language === "fr" ? "Merci de traiter ce point rapidement." : language === "en" ? "Please address this promptly." : "Bitte bearbeiten Sie dies zeitnah."}`;
  }
  if (tone === "courteous") {
    text = `${text}\n\n${language === "fr" ? "Merci d’avance pour votre aide." : language === "en" ? "Thank you in advance for your help." : "Vielen Dank im Voraus für Ihre Unterstützung."}`;
  }
  return ensureGreetingAndClosing(text, language);
}

function fallbackTranslate(input: string, language: AssistantLocale) {
  let text = input;
  if (!text) return text;
  if (language === "en") {
    text = text.replace(/Bonjour/gi, "Hello").replace(/Cordialement/gi, "Best regards");
  } else if (language === "de") {
    text = text.replace(/Bonjour/gi, "Guten Tag").replace(/Cordialement/gi, "Mit freundlichen Grüßen");
  } else {
    text = text.replace(/Hello/gi, "Bonjour").replace(/Best regards/gi, "Cordialement");
  }
  return text;
}

async function callOpenAI({
  apiKey,
  prompt,
  locale,
  action,
}: {
  apiKey: string;
  prompt: string;
  locale: AssistantLocale;
  action: AssistantAction;
}) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: action === "compose" ? 0.3 : 0.2,
      messages: [
        {
          role: "system",
          content: [
            "Tu es l’Assistant administratif intelligent d’Organa,",
            "un logiciel de gestion administrative destiné aux indépendants et aux PME.",
            "",
            "Ton rôle est d’aider l’utilisateur à rédiger des contenus administratifs",
            "professionnels, clairs, structurés et exploitables immédiatement.",
            "",
            "RÈGLES DE COMPORTEMENT (OBLIGATOIRES) :",
            "",
            "1. Tu ne réponds JAMAIS en une ou deux phrases",
            "   sauf si la demande est explicitement courte.",
            "   Par défaut, tes réponses doivent être développées,",
            "   structurées et complètes.",
            "",
            "2. Lorsque l’utilisateur demande :",
            "   - d’écrire un email",
            "   - de reformuler un message",
            "   - de rédiger une relance",
            "   - de répondre à un client",
            "",
            "   Tu dois produire :",
            "   - un email complet",
            "   - avec une introduction professionnelle",
            "   - un corps structuré",
            "   - une conclusion claire",
            "   - une signature professionnelle générique si nécessaire",
            "",
            "3. Tu adaptes le TON selon le contexte :",
            "   - professionnel",
            "   - courtois",
            "   - ferme mais respectueux si relance",
            "   - jamais familier",
            "",
            "4. Tu prends en compte le CONTEXTE fourni par Organa :",
            "   - nom du client",
            "   - montant",
            "   - facture / devis",
            "   - échéance",
            "   - langue sélectionnée",
            "",
            "5. Si une information manque, tu fais une hypothèse raisonnable",
            "   ou tu proposes une version générique professionnelle.",
            "",
            "6. Tu évites toute réponse vague ou générique.",
            "   Chaque réponse doit être exploitable telle quelle par l’utilisateur.",
            "",
            "7. Tu peux proposer, en fin de réponse :",
            "   - une variante plus ferme",
            "   - ou une variante plus courte",
            "   - ou une version traduite",
            "   MAIS uniquement après avoir fourni la version principale complète.",
            "",
            "OBJECTIF FINAL :",
            "Agir comme un véritable assistant administratif humain,",
            "pas comme un simple chatbot.",
            "",
            `Langue de sortie : ${languageNames[locale]}.`,
            "Retourne UNIQUEMENT du JSON strict avec les clés subject et body.",
            "Aucun markdown. Aucun texte hors JSON.",
          ].join("\n"),
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Erreur IA");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action as AssistantAction;
    const language = (body?.language as AssistantLocale) || "fr";
    const composeType = (body?.composeType as ComposeType) || "generic";
    const tone = body?.tone || "professional";
    const instruction = body?.instruction || "";
    const input = body?.input || "";
    const subject = body?.subject || "";
    const context = body?.context || {};

    if (!action || !["compose", "rephrase", "translate"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    let result: { subject: string; body: string } | null = null;

    const promptParts: string[] = [];
    promptParts.push(`Action: ${action}`);
    if (action === "compose") {
      promptParts.push(`Type: ${composeType}`);
      promptParts.push(`Instruction: ${instruction || "none"}`);
      promptParts.push(`Context: ${JSON.stringify(context)}`);
      promptParts.push("Generate a professional administrative email.");
    } else if (action === "rephrase") {
      promptParts.push(`Tone: ${tone}`);
      promptParts.push(`Subject: ${subject || "none"}`);
      promptParts.push(`Input: ${input}`);
      promptParts.push("Rewrite to match the requested tone.");
    } else {
      promptParts.push(`Target language: ${languageNames[language]}`);
      promptParts.push(`Subject: ${subject || "none"}`);
      promptParts.push(`Input: ${input}`);
      promptParts.push("Translate and keep a professional SaaS/admin tone.");
    }

    if (openaiKey) {
      result = await callOpenAI({
        apiKey: openaiKey,
        prompt: promptParts.join("\n"),
        locale: language,
        action,
      });
    }

    if (!result || !result.body) {
      if (action === "compose") {
        result = buildFallbackEmail({ language, composeType, context });
      } else if (action === "rephrase") {
        result = {
          subject: subject || defaultSubjects[language][composeType],
          body: fallbackRephrase(input, tone, language),
        };
      } else {
        result = {
          subject: subject || defaultSubjects[language][composeType],
          body: fallbackTranslate(input, language),
        };
      }
    }

    return NextResponse.json({
      subject: result.subject?.trim() || defaultSubjects[language][composeType],
      body: result.body?.trim() || input,
    });
  } catch (error: any) {
    console.error("[Assistant] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error?.message || "Erreur inconnue" },
      { status: 500 }
    );
  }
}

