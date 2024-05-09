import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import XHR from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

//Import all translation files
import translationEnglish from "@i18n/_locales/en/messages.json";
import translationSpanish from "@i18n/_locales/es/messages.json";
import translationFrench from "@i18n/_locales/fr/messages.json";

//---Using translation
const resources = {
  en: {
    translation: translationEnglish,
  },
  es: {
    translation: translationSpanish,
  },
  fr: {
    translation: translationFrench,
  },
};

const LANGUAGE_DETECTION_OPTIONS = {
  order: ["querystring", "navigator"],
  lookupQuerystring: "lng",
};

i18next
  .use(XHR)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: LANGUAGE_DETECTION_OPTIONS,
    resources,
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "en",
  });

export default i18next;
