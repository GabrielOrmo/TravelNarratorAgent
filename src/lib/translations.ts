
import type { Locale } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';

type TranslationKeys = {
  // Header
  appSubtitle: string;
  // Page
  footerCopyright: string;
  toastNarrativeGeneratedTitle: string;
  toastNarrativeGeneratedDescription: (location: string) => string;
  toastGenerationFailedTitle: string;
  // NarratorForm
  formTitle: string;
  formDescription: string;
  locationNameLabel: string;
  locationNamePlaceholder: string;
  locationNameDescription: string;
  useCurrentLocationButton: string;
  fetchingLocationButton: string;
  geolocationNotSupported: string;
  geolocationPermissionDenied: string;
  geolocationPositionUnavailable: string;
  geolocationTimeout: string;
  geolocationUnknownError: string;
  geolocationErrorTitle: string;
  geolocationSuccessTitle: string;
  geolocationSuccessDescription: string;
  geolocationCoordinates: string;
  orSeparator: string;
  locationImageLabel: string;
  uploadImageTab: string;
  useCameraTab: string;
  uploadImageDescription: string;
  cameraAccessProblemTitle: string;
  cameraAccessProblemDescription: string;
  cameraNotSupported: string;
  captureImageButton: string;
  imagePreviewTitle: string;
  clearImageButton: string;
  informationStyleLabel: string;
  styleHistoricalLabel: string;
  styleHistoricalDescription: string;
  styleCuriousLabel: string;
  styleCuriousDescription: string;
  styleLegendsLabel: string;
  styleLegendsDescription: string;
  outputLanguageLabel: string;
  selectLanguagePlaceholder: string;
  outputLanguageDescription: string;
  languageEn: string;
  languageEs: string;
  languageFr: string;
  languageDe: string;
  languageJa: string;
  generateNarrativeButton: string;
  generatingButton: string;
  // NarratorForm Skeletons (simple, usually not translated or generic)
  loadingYear: string;
  // NarrativeDisplay
  narrativeDisplayTitle: string;
  narrativeDisplayDescription: string;
  identifiedLocationLabel: string;
  audioNarrationLabel: string;
  audioNotSupported: string;
  audioUnavailableTitle: string;
  audioUnavailableDescription: string;
  narrativeTextLabel: string;
  noNarrativeText: string;
  followUpQuestionLabel: string;
  micIssueAlertTitle: string;
  micIssueAlertDescription: (error: string) => string;
  followUpPlaceholder: string;
  stopRecordingButtonAria: string;
  startRecordingButtonAria: string;
  submitQuestionButton: string;
  gettingAnswerButton: string;
  aiThinking: string;
  yourQuestionLabel: string;
  aiAnswerLabel: string;
  followUpFailedToastTitle: string;
  followUpAnswerReadyToastTitle: string;
  followUpAnswerReadyToastDescription: string;
  narrativeDisplayFooter: string; 
  narrativeDisplayFooterWebhook: string; 
  emptyQuestionToastTitle: string;
  emptyQuestionToastDescription: string;
  voiceInputNotReadyToastTitle: string;
  voiceInputNotReadyToastDescription: (error: string) => string;
  micDeniedToastTitle: string;
  micDeniedToastDescription: string;
  speechErrorToastTitle: string;
  speechErrorToastDescription: (error: string) => string;
  couldNotStartRecordingToastTitle: string;
  couldNotStartRecordingToastDescription: (error: string) => string;


  // PlaceholderCard
  placeholderCardTitle: string;
  placeholderCardDescription: string;
  // LoadingSpinner
  loadingSpinnerText: string;
};

const translationsData: Record<Locale, TranslationKeys> = {
  en: {
    appSubtitle: 'Your personal AI-powered axolotl travel tour guide.',
    footerCopyright: 'Aijolot Travel Guide. AI-powered by Genkit & External Agent.',
    toastNarrativeGeneratedTitle: 'Narrative Ready!',
    toastNarrativeGeneratedDescription: (location) => `Your agent response for ${location || 'the location'} is ready.`,
    toastGenerationFailedTitle: 'Generation Failed',
    formTitle: 'Describe Your Destination',
    formDescription: 'Enter a location, use an image, or share your current location. Then, choose your narration style.',
    locationNameLabel: 'Location Name or Description',
    locationNamePlaceholder: 'e.g., Eiffel Tower, Paris',
    locationNameDescription: 'Type the name or a brief description of the location.',
    useCurrentLocationButton: 'Use My Current Location',
    fetchingLocationButton: 'Fetching Location...',
    geolocationNotSupported: 'Geolocation is not supported by your browser.',
    geolocationPermissionDenied: 'Permission to access location was denied. Please enable it in your browser settings.',
    geolocationPositionUnavailable: 'Location information is unavailable.',
    geolocationTimeout: 'The request to get user location timed out.',
    geolocationUnknownError: 'An unknown error occurred while trying to get your location.',
    geolocationErrorTitle: 'Location Error',
    geolocationSuccessTitle: 'Location Acquired',
    geolocationSuccessDescription: 'Your current location will be sent to the agent.',
    geolocationCoordinates: 'Coordinates',
    orSeparator: 'OR',
    locationImageLabel: 'Location Image',
    uploadImageTab: 'Upload Image',
    useCameraTab: 'Use Camera',
    uploadImageDescription: 'Upload a clear picture of the landmark or location.',
    cameraAccessProblemTitle: 'Camera Access Problem',
    cameraAccessProblemDescription: 'Could not access the camera. Please ensure permissions are granted.',
    cameraNotSupported: "Your browser does not support camera access.",
    captureImageButton: 'Capture Image',
    imagePreviewTitle: 'Image Preview:',
    clearImageButton: 'Clear Image',
    informationStyleLabel: 'Information Style',
    styleHistoricalLabel: 'Historical',
    styleHistoricalDescription: 'Focus on facts, dates, and historical significance.',
    styleCuriousLabel: 'Curious',
    styleCuriousDescription: 'Uncover interesting tidbits and unusual details.',
    styleLegendsLabel: 'Legends',
    styleLegendsDescription: 'Explore myths, folklore, and captivating stories.',
    outputLanguageLabel: 'Output Language',
    selectLanguagePlaceholder: 'Select a language',
    outputLanguageDescription: 'Choose the language for the narrative.',
    languageEn: 'English',
    languageEs: 'Español (Spanish)',
    languageFr: 'Français (French)',
    languageDe: 'Deutsch (German)',
    languageJa: '日本語 (Japanese)',
    generateNarrativeButton: 'Get Agent Response',
    generatingButton: 'Contacting Agent...',
    loadingYear: 'Loading year...',
    narrativeDisplayTitle: 'Agent Response',
    narrativeDisplayDescription: 'View the response from the AI agent and ask follow-up questions.',
    identifiedLocationLabel: 'Interpreted Location:',
    audioNarrationLabel: 'Audio Narration',
    audioNotSupported: 'Your browser does not support the audio element.',
    audioUnavailableTitle: 'Audio Not Available',
    audioUnavailableDescription: 'The agent response does not include audio. Follow-up questions will have audio.',
    narrativeTextLabel: 'Agent Text Response',
    noNarrativeText: 'No text response from agent available.',
    followUpQuestionLabel: 'Ask a Follow-up Question',
    micIssueAlertTitle: 'Microphone Issue',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Type your question or use the microphone...',
    stopRecordingButtonAria: 'Stop recording',
    startRecordingButtonAria: 'Start recording',
    submitQuestionButton: 'Submit Question',
    gettingAnswerButton: 'Getting Answer...',
    aiThinking: 'AI is thinking...',
    yourQuestionLabel: 'Your Question:',
    aiAnswerLabel: "AI's Answer:",
    followUpFailedToastTitle: 'Follow-up Failed',
    followUpAnswerReadyToastTitle: 'Follow-up Answer Ready!',
    followUpAnswerReadyToastDescription: 'Your question has been answered.',
    narrativeDisplayFooter: 'Narrative, answers, and audio generated by AI. Enjoy your virtual tour!',
    narrativeDisplayFooterWebhook: 'Agent response provided by external webhook. Follow-up Q&A audio generated by this app.',
    emptyQuestionToastTitle: 'Empty Question',
    emptyQuestionToastDescription: 'Please ask a question.',
    voiceInputNotReadyToastTitle: "Voice Input Not Ready",
    voiceInputNotReadyToastDescription: (error) => error || "Speech recognition is not available.",
    micDeniedToastTitle: "Microphone Access Denied",
    micDeniedToastDescription: "Please enable microphone permissions in your browser settings.",
    speechErrorToastTitle: "Speech Recognition Error",
    speechErrorToastDescription: (error) => `Could not process audio: ${error}`,
    couldNotStartRecordingToastTitle: "Could Not Start Recording",
    couldNotStartRecordingToastDescription: (error) => error || "Unknown error starting voice input.",
    placeholderCardTitle: 'Ready to Query the Agent?',
    placeholderCardDescription: "Enter a location or image, and choose your preferred style. We'll send it to the AI agent for a response!",
    loadingSpinnerText: 'Contacting AI agent and preparing response...',
  },
  es: {
    appSubtitle: 'Tu guía turístico personal axolotl impulsado por IA.',
    footerCopyright: 'Aijolot Travel Guide. IA impulsada por Genkit y Agente Externo.',
    toastNarrativeGeneratedTitle: '¡Respuesta del Agente Lista!',
    toastNarrativeGeneratedDescription: (location) => `La respuesta de tu agente para ${location || 'la ubicación'} está lista.`,
    toastGenerationFailedTitle: 'Falló la Generación',
    formTitle: 'Describe Tu Destino',
    formDescription: 'Ingresa una ubicación, usa una imagen o comparte tu ubicación actual. Luego, elige tu estilo de narración.',
    locationNameLabel: 'Nombre o Descripción de la Ubicación',
    locationNamePlaceholder: 'Ej: Torre Eiffel, París',
    locationNameDescription: 'Escribe el nombre o una breve descripción de la ubicación.',
    useCurrentLocationButton: 'Usar Mi Ubicación Actual',
    fetchingLocationButton: 'Obteniendo Ubicación...',
    geolocationNotSupported: 'La geolocalización no es compatible con tu navegador.',
    geolocationPermissionDenied: 'Se denegó el permiso para acceder a la ubicación. Por favor, actívalo en la configuración de tu navegador.',
    geolocationPositionUnavailable: 'La información de ubicación no está disponible.',
    geolocationTimeout: 'La solicitud para obtener la ubicación del usuario expiró.',
    geolocationUnknownError: 'Ocurrió un error desconocido al intentar obtener tu ubicación.',
    geolocationErrorTitle: 'Error de Ubicación',
    geolocationSuccessTitle: 'Ubicación Adquirida',
    geolocationSuccessDescription: 'Tu ubicación actual se enviará al agente.',
    geolocationCoordinates: 'Coordenadas',
    orSeparator: 'O',
    locationImageLabel: 'Imagen de la Ubicación',
    uploadImageTab: 'Subir Imagen',
    useCameraTab: 'Usar Cámara',
    uploadImageDescription: 'Sube una foto clara del lugar o punto de interés.',
    cameraAccessProblemTitle: 'Problema de Acceso a la Cámara',
    cameraAccessProblemDescription: 'No se pudo acceder a la cámara. Asegúrate de que los permisos estén concedidos.',
    cameraNotSupported: "Tu navegador no soporta el acceso a la cámara.",
    captureImageButton: 'Capturar Imagen',
    imagePreviewTitle: 'Vista Previa de Imagen:',
    clearImageButton: 'Limpiar Imagen',
    informationStyleLabel: 'Estilo de Información',
    styleHistoricalLabel: 'Histórico',
    styleHistoricalDescription: 'Enfócate en hechos, fechas y significado histórico.',
    styleCuriousLabel: 'Curioso',
    styleCuriousDescription: 'Descubre datos interesantes y detalles inusuales.',
    styleLegendsLabel: 'Leyendas',
    styleLegendsDescription: 'Explora mitos, folclore e historias cautivadoras.',
    outputLanguageLabel: 'Idioma de Salida',
    selectLanguagePlaceholder: 'Selecciona un idioma',
    outputLanguageDescription: 'Elige el idioma para la narración.',
    languageEn: 'Inglés',
    languageEs: 'Español',
    languageFr: 'Francés',
    languageDe: 'Alemán',
    languageJa: 'Japonés',
    generateNarrativeButton: 'Obtener Respuesta del Agente',
    generatingButton: 'Contactando Agente...',
    loadingYear: 'Cargando año...',
    narrativeDisplayTitle: 'Respuesta del Agente',
    narrativeDisplayDescription: 'Visualiza la respuesta del agente IA y haz preguntas de seguimiento.',
    identifiedLocationLabel: 'Ubicación Interpretada:',
    audioNarrationLabel: 'Narración en Audio',
    audioNotSupported: 'Tu navegador no soporta el elemento de audio.',
    audioUnavailableTitle: 'Audio No Disponible',
    audioUnavailableDescription: 'La respuesta del agente no incluye audio. Las preguntas de seguimiento tendrán audio.',
    narrativeTextLabel: 'Respuesta de Texto del Agente',
    noNarrativeText: 'No hay respuesta de texto del agente disponible.',
    followUpQuestionLabel: 'Haz una Pregunta de Seguimiento',
    micIssueAlertTitle: 'Problema con el Micrófono',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Escribe tu pregunta o usa el micrófono...',
    stopRecordingButtonAria: 'Detener grabación',
    startRecordingButtonAria: 'Iniciar grabación',
    submitQuestionButton: 'Enviar Pregunta',
    gettingAnswerButton: 'Obteniendo Respuesta...',
    aiThinking: 'IA está pensando...',
    yourQuestionLabel: 'Tu Pregunta:',
    aiAnswerLabel: 'Respuesta de la IA:',
    followUpFailedToastTitle: 'Pregunta de Seguimiento Fallida',
    followUpAnswerReadyToastTitle: '¡Respuesta de Seguimiento Lista!',
    followUpAnswerReadyToastDescription: 'Tu pregunta ha sido respondida.',
    narrativeDisplayFooter: 'Narrativa, respuestas y audio generados por IA. ¡Disfruta tu recorrido virtual!',
    narrativeDisplayFooterWebhook: 'Respuesta del agente proporcionada por webhook externo. Audio de Q&A de seguimiento generado por esta app.',
    emptyQuestionToastTitle: 'Pregunta Vacía',
    emptyQuestionToastDescription: 'Por favor haz una pregunta.',
    voiceInputNotReadyToastTitle: "Entrada de Voz No Lista",
    voiceInputNotReadyToastDescription: (error) => error || "El reconocimiento de voz no está disponible.",
    micDeniedToastTitle: "Acceso al Micrófono Denegado",
    micDeniedToastDescription: "Por favor, habilita los permisos del micrófono en la configuración de tu navegador.",
    speechErrorToastTitle: "Error de Reconocimiento de Voz",
    speechErrorToastDescription: (error) => `No se pudo procesar el audio: ${error}`,
    couldNotStartRecordingToastTitle: "No se Pudo Iniciar la Grabación",
    couldNotStartRecordingToastDescription: (error) => error || "Error desconocido al iniciar la entrada de voz.",
    placeholderCardTitle: '¿Listo para Consultar al Agente?',
    placeholderCardDescription: 'Ingresa una ubicación o imagen, y elige tu estilo preferido. ¡Lo enviaremos al agente IA para una respuesta!',
    loadingSpinnerText: 'Contactando agente IA y preparando respuesta...',
  },
  fr: {
    appSubtitle: 'Votre guide touristique personnel axolotl alimenté par IA.',
    footerCopyright: 'Aijolot Travel Guide. IA alimentée par Genkit & Agent Externe.',
    toastNarrativeGeneratedTitle: "Réponse de l'Agent Prête !",
    toastNarrativeGeneratedDescription: (location) => `La réponse de votre agent pour ${location || "l'endroit"} est prête.`,
    toastGenerationFailedTitle: 'Échec de la Génération',
    formTitle: 'Décrivez Votre Destination',
    formDescription: "Entrez un lieu, utilisez une image ou partagez votre position actuelle. Ensuite, choisissez votre style de narration.",
    locationNameLabel: 'Nom ou Description du Lieu',
    locationNamePlaceholder: 'Ex: Tour Eiffel, Paris',
    locationNameDescription: 'Tapez le nom ou une brève description du lieu.',
    useCurrentLocationButton: 'Utiliser Ma Position Actuelle',
    fetchingLocationButton: 'Récupération Position...',
    geolocationNotSupported: 'La géolocalisation n’est pas supportée par votre navigateur.',
    geolocationPermissionDenied: 'L’autorisation d’accéder à la position a été refusée. Veuillez l’activer dans les paramètres de votre navigateur.',
    geolocationPositionUnavailable: 'Les informations de position sont indisponibles.',
    geolocationTimeout: 'La demande de récupération de la position utilisateur a expiré.',
    geolocationUnknownError: 'Une erreur inconnue est survenue lors de la tentative de récupération de votre position.',
    geolocationErrorTitle: 'Erreur de Position',
    geolocationSuccessTitle: 'Position Acquise',
    geolocationSuccessDescription: 'Votre position actuelle sera envoyée à l’agent.',
    geolocationCoordinates: 'Coordonnées',
    orSeparator: 'OU',
    locationImageLabel: 'Image du Lieu',
    uploadImageTab: 'Télécharger Image',
    useCameraTab: 'Utiliser Caméra',
    uploadImageDescription: 'Téléchargez une photo claire du lieu ou du point d’intérêt.',
    cameraAccessProblemTitle: "Problème d'Accès Caméra",
    cameraAccessProblemDescription: "Impossible d'accéder à la caméra. Veuillez vous assurer que les autorisations sont accordées.",
    cameraNotSupported: "Votre navigateur ne prend pas en charge l'accès à la caméra.",
    captureImageButton: "Capturer l'Image",
    imagePreviewTitle: 'Aperçu Image:',
    clearImageButton: 'Effacer Image',
    informationStyleLabel: "Style d'Information",
    styleHistoricalLabel: 'Historique',
    styleHistoricalDescription: 'Concentrez-vous sur les faits, les dates et la signification historique.',
    styleCuriousLabel: 'Curieux',
    styleCuriousDescription: 'Découvrez des anecdotes intéressantes et des détails insolites.',
    styleLegendsLabel: 'Légendes',
    styleLegendsDescription: 'Explorez les mythes, le folklore et les histoires captivantes.',
    outputLanguageLabel: 'Langue de Sortie',
    selectLanguagePlaceholder: 'Sélectionnez une langue',
    outputLanguageDescription: 'Choisissez la langue pour la narration.',
    languageEn: 'Anglais',
    languageEs: 'Espagnol',
    languageFr: 'Français',
    languageDe: 'Allemand',
    languageJa: 'Japonais',
    generateNarrativeButton: "Obtenir Réponse de l'Agent",
    generatingButton: "Contact de l'Agent...",
    loadingYear: "Chargement de l'année...",
    narrativeDisplayTitle: "Réponse de l'Agent",
    narrativeDisplayDescription: "Visualisez la réponse de l'agent IA et posez des questions de suivi.",
    identifiedLocationLabel: 'Lieu Interprété:',
    audioNarrationLabel: 'Narration Audio',
    audioNotSupported: "Votre navigateur ne supporte pas l'élément audio.",
    audioUnavailableTitle: 'Audio Non Disponible',
    audioUnavailableDescription: "La réponse de l'agent n'inclut pas d'audio. Les questions de suivi auront de l'audio.",
    narrativeTextLabel: "Réponse Texte de l'Agent",
    noNarrativeText: "Aucune réponse texte de l'agent disponible.",
    followUpQuestionLabel: 'Poser une Question de Suivi',
    micIssueAlertTitle: 'Problème de Microphone',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Tapez votre question ou utilisez le microphone...',
    stopRecordingButtonAria: "Arrêter l'enregistrement",
    startRecordingButtonAria: "Démarrer l'enregistrement",
    submitQuestionButton: 'Soumettre Question',
    gettingAnswerButton: 'Obtention Réponse...',
    aiThinking: "L'IA réfléchit...",
    yourQuestionLabel: 'Votre Question:',
    aiAnswerLabel: "Réponse de lIA:",
    followUpFailedToastTitle: 'Échec Question Suivi',
    followUpAnswerReadyToastTitle: 'Réponse de Suivi Prête !',
    followUpAnswerReadyToastDescription: 'Votre question a été répondue.',
    narrativeDisplayFooter: "Narration, réponses et audio générés par IA. Profitez de votre visite virtuelle !",
    narrativeDisplayFooterWebhook: "Réponse de l'agent fournie par webhook externe. Audio Q&R de suivi généré par cette application.",
    emptyQuestionToastTitle: 'Question Vide',
    emptyQuestionToastDescription: 'Veuillez poser une question.',
    voiceInputNotReadyToastTitle: "Entrée Vocale Non Prête",
    voiceInputNotReadyToastDescription: (error) => error || "La reconnaissance vocale n'est pas disponible.",
    micDeniedToastTitle: "Accès Microphone Refusé",
    micDeniedToastDescription: "Veuillez activer les autorisations du microphone dans les paramètres de votre navigateur.",
    speechErrorToastTitle: "Erreur de Reconnaissance Vocale",
    speechErrorToastDescription: (error) => `Impossible de traiter l'audio: ${error}`,
    couldNotStartRecordingToastTitle: "Impossible de Démarrer l'Enregistrement",
    couldNotStartRecordingToastDescription: (error) => error || "Erreur inconnue lors du démarrage de l'entrée vocale.",
    placeholderCardTitle: "Prêt à Interroger l'Agent ?",
    placeholderCardDescription: "Entrez un lieu ou une image, et choisissez votre style préféré. Nous l'enverrons à l'agent IA pour une réponse !",
    loadingSpinnerText: "Contact de l'agent IA et préparation de la réponse...",
  },
};

export function useTranslations() {
  const { language } = useLanguage();
  return translationsData[language];
}
