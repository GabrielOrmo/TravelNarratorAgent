
import type { Locale } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';

type TranslationKeys = {
  // Header / Hero
  appSubtitle: string;
  heroImageAlt: string;
  // Page
  footerCopyright: string;
  toastNarrativeGeneratedTitle: string;
  toastNarrativeGeneratedDescription: (location: string) => string;
  toastGenerationFailedTitle: string;
  // NarratorForm
  formTitle: string;
  formDescription: string; // Updated
  imageInputSectionTitle: string; // New
  describeLocationSectionTitle: string; // New
  currentLocationSectionTitle: string; // New
  orSeparatorText: string; // New

  locationNameLabel: string;
  locationNamePlaceholder: string;
  locationNameDescription: string;
  autocompleteLoading: string;
  autocompleteNoResults: string;
  autocompleteErrorTitle: string;
  useCurrentLocationButton: string;
  scanWithCameraButton: string;
  uploadImageButton: string;
  cancelCameraButton: string;
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
  cameraAccessProblemTitle: string;
  cameraAccessProblemDescription: string;
  cameraNotSupported: string;
  captureImageButton: string;
  imagePreviewTitle: string;
  imagePreviewAlt: string;
  clearImageButton: string;
  informationStyleLabel: string;
  styleHistoricalLabel: string;
  styleHistoricalDescription: string;
  styleCuriousLabel: string;
  styleCuriousDescription: string;
  styleLegendsLabel: string;
  styleLegendsDescription: string;
  generateNarrativeButton: string;
  generatingButton: string;
  loadingYear: string;
  // NarrativeDisplay
  narrativeDisplayTitle: string;
  narrativeDisplayDescription: string;
  identifiedLocationLabel: string;
  audioNarrationLabel: string;
  initialNarrativeLabel: string;
  startConversationPlaceholder: string;
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
  narrativeDisplayFooterWebhook: string;
  exploreNewLocationButton: string;
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
  // PlaceholderCard (no longer used in main flow)
  placeholderCardTitle: string;
  placeholderCardDescription: string;
  // LoadingSpinner
  loadingSpinnerText: string;
};

const translationsData: Record<Locale, TranslationKeys> = {
  en: {
    appSubtitle: 'Your personal AI-powered axolotl travel tour guide.',
    heroImageAlt: 'A stylized, friendly axolotl peeking over the Eiffel Tower.',
    footerCopyright: 'Aijolot Travel Guide. AI-powered by Genkit & External Agent.',
    toastNarrativeGeneratedTitle: 'Narrative Ready!',
    toastNarrativeGeneratedDescription: (location) => `Your agent response for ${location || 'the location'} is ready.`,
    toastGenerationFailedTitle: 'Generation Failed',
    formTitle: 'Where are we exploring?',
    formDescription: 'Let Aijolot be your guide! Scan, upload an image, describe a place, or use your current location to discover hidden gems.',
    imageInputSectionTitle: 'Point, Shoot, or Upload an Image',
    describeLocationSectionTitle: 'Or, Type a Place to Explore',
    currentLocationSectionTitle: "Discover What's Around You",
    orSeparatorText: "OR",
    locationNameLabel: 'Location Name or Description',
    locationNamePlaceholder: 'e.g., Eiffel Tower, Paris',
    locationNameDescription: 'Type the name or a brief description.',
    autocompleteLoading: 'Loading suggestions...',
    autocompleteNoResults: 'No results found.',
    autocompleteErrorTitle: 'Autocomplete Error',
    useCurrentLocationButton: 'Use My Current Location',
    scanWithCameraButton: 'Scan w/ Camera',
    uploadImageButton: 'Upload Image',
    cancelCameraButton: 'Cancel Camera',
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
    cameraAccessProblemTitle: 'Camera Access Problem',
    cameraAccessProblemDescription: 'Could not access the camera. Please ensure permissions are granted.',
    cameraNotSupported: "Your browser does not support camera access.",
    captureImageButton: 'Capture Image',
    imagePreviewTitle: 'Image Preview:',
    imagePreviewAlt: 'Preview of the uploaded or captured location image.',
    clearImageButton: 'Clear Image',
    informationStyleLabel: 'How do you want to hear the story?',
    styleHistoricalLabel: 'Historical',
    styleHistoricalDescription: 'Focus on facts, dates, and historical significance.',
    styleCuriousLabel: 'Curious',
    styleCuriousDescription: 'Uncover interesting tidbits and unusual details.',
    styleLegendsLabel: 'Legends',
    styleLegendsDescription: 'Explore myths, folklore, and captivating stories.',
    generateNarrativeButton: 'Get Agent Response',
    generatingButton: 'Contacting Agent...',
    loadingYear: 'Loading year...',
    narrativeDisplayTitle: 'Aijolot Chat',
    narrativeDisplayDescription: 'Interact with your AI travel guide.',
    identifiedLocationLabel: 'Location Context:',
    audioNarrationLabel: 'Audio Narration',
    initialNarrativeLabel: 'Initial Narrative',
    startConversationPlaceholder: 'Enter details above to start your AI-guided tour!',
    audioNotSupported: 'Your browser does not support the audio element.',
    audioUnavailableTitle: 'Audio Not Available',
    audioUnavailableDescription: 'Audio for this narrative could not be generated or is not available.',
    narrativeTextLabel: 'Agent Text Response',
    noNarrativeText: 'No text response from agent available.',
    followUpQuestionLabel: 'Ask a Follow-up Question',
    micIssueAlertTitle: 'Microphone Issue',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Ask a follow-up question...',
    stopRecordingButtonAria: 'Stop recording',
    startRecordingButtonAria: 'Start recording',
    submitQuestionButton: 'Submit Question',
    gettingAnswerButton: 'Getting Answer...',
    aiThinking: 'Aijolot is thinking...',
    yourQuestionLabel: 'Your Question:',
    aiAnswerLabel: "Aijolot's Answer:",
    followUpFailedToastTitle: 'Follow-up Failed',
    followUpAnswerReadyToastTitle: 'Follow-up Answer Ready!',
    followUpAnswerReadyToastDescription: 'Your question has been answered.',
    narrativeDisplayFooterWebhook: 'Agent response provided by external webhook. Audio generated by this app.',
    exploreNewLocationButton: 'Explore New Location',
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
    heroImageAlt: 'Un ajolote estilizado y amigable asomándose sobre la Torre Eiffel.',
    footerCopyright: 'Aijolot Travel Guide. IA impulsada por Genkit y Agente Externo.',
    toastNarrativeGeneratedTitle: '¡Respuesta del Agente Lista!',
    toastNarrativeGeneratedDescription: (location) => `La respuesta de tu agente para ${location || 'la ubicación'} está lista.`,
    toastGenerationFailedTitle: 'Falló la Generación',
    formTitle: '¿Dónde estamos explorando?',
    formDescription: '¡Deja que Aijolot sea tu guía! Escanea, sube una imagen, describe un lugar o usa tu ubicación actual para descubrir joyas ocultas.',
    imageInputSectionTitle: 'Apunta, Dispara o Sube una Imagen',
    describeLocationSectionTitle: 'O, Escribe un Lugar para Explorar',
    currentLocationSectionTitle: 'Descubre Qué Hay a tu Alrededor',
    orSeparatorText: "O",
    locationNameLabel: 'Nombre o Descripción de la Ubicación',
    locationNamePlaceholder: 'Ej: Torre Eiffel, París',
    locationNameDescription: 'Escribe el nombre o una breve descripción.',
    autocompleteLoading: 'Cargando sugerencias...',
    autocompleteNoResults: 'No se encontraron resultados.',
    autocompleteErrorTitle: 'Error de Autocompletar',
    useCurrentLocationButton: 'Usar Mi Ubicación Actual',
    scanWithCameraButton: 'Escanear c/ Cámara',
    uploadImageButton: 'Subir Imagen',
    cancelCameraButton: 'Cancelar Cámara',
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
    cameraAccessProblemTitle: 'Problema de Acceso a la Cámara',
    cameraAccessProblemDescription: 'No se pudo acceder a la cámara. Asegúrate de que los permisos estén concedidos.',
    cameraNotSupported: "Tu navegador no soporta el acceso a la cámara.",
    captureImageButton: 'Capturar Imagen',
    imagePreviewTitle: 'Vista Previa de Imagen:',
    imagePreviewAlt: 'Vista previa de la imagen de ubicación cargada o capturada.',
    clearImageButton: 'Limpiar Imagen',
    informationStyleLabel: '¿Cómo quieres escuchar la historia?',
    styleHistoricalLabel: 'Histórico',
    styleHistoricalDescription: 'Enfócate en hechos, fechas y significado histórico.',
    styleCuriousLabel: 'Curioso',
    styleCuriousDescription: 'Descubre datos interesantes y detalles inusuales.',
    styleLegendsLabel: 'Leyendas',
    styleLegendsDescription: 'Explora mitos, folclore e historias cautivadoras.',
    generateNarrativeButton: 'Obtener Respuesta del Agente',
    generatingButton: 'Contactando Agente...',
    loadingYear: 'Cargando año...',
    narrativeDisplayTitle: 'Chat Aijolot',
    narrativeDisplayDescription: 'Interactúa con tu guía turístico IA.',
    identifiedLocationLabel: 'Contexto de Ubicación:',
    audioNarrationLabel: 'Narración en Audio',
    initialNarrativeLabel: 'Narrativa Inicial',
    startConversationPlaceholder: '¡Ingresa detalles arriba para comenzar tu recorrido guiado por IA!',
    audioNotSupported: 'Tu navegador no soporta el elemento de audio.',
    audioUnavailableTitle: 'Audio No Disponible',
    audioUnavailableDescription: 'El audio para esta narrativa no pudo ser generado o no está disponible.',
    narrativeTextLabel: 'Respuesta de Texto del Agente',
    noNarrativeText: 'No hay respuesta de texto del agente disponible.',
    followUpQuestionLabel: 'Haz una Pregunta de Seguimiento',
    micIssueAlertTitle: 'Problema con el Micrófono',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Haz una pregunta de seguimiento...',
    stopRecordingButtonAria: 'Detener grabación',
    startRecordingButtonAria: 'Iniciar grabación',
    submitQuestionButton: 'Enviar Pregunta',
    gettingAnswerButton: 'Obteniendo Respuesta...',
    aiThinking: 'Aijolot está pensando...',
    yourQuestionLabel: 'Tu Pregunta:',
    aiAnswerLabel: 'Respuesta de Aijolot:',
    followUpFailedToastTitle: 'Pregunta de Seguimiento Fallida',
    followUpAnswerReadyToastTitle: '¡Respuesta de Seguimiento Lista!',
    followUpAnswerReadyToastDescription: 'Tu pregunta ha sido respondida.',
    narrativeDisplayFooterWebhook: 'Respuesta del agente proporcionada por webhook externo. Audio generado por esta app.',
    exploreNewLocationButton: 'Explorar Nuevo Lugar',
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
    heroImageAlt: 'Un axolotl stylisé et amical regardant par-dessus la Tour Eiffel.',
    footerCopyright: 'Aijolot Travel Guide. IA alimentée par Genkit & Agent Externe.',
    toastNarrativeGeneratedTitle: "Réponse de l'Agent Prête !",
    toastNarrativeGeneratedDescription: (location) => `La réponse de votre agent pour ${location || "l'endroit"} est prête.`,
    toastGenerationFailedTitle: 'Échec de la Génération',
    formTitle: 'Où explorons-nous ?',
    formDescription: "Laissez Aijolot être votre guide ! Scannez, téléchargez une image, décrivez un lieu ou utilisez votre position actuelle pour découvrir des trésors cachés.",
    imageInputSectionTitle: "Pointez, Photographiez ou Téléchargez une Image",
    describeLocationSectionTitle: "Ou, Décrivez un Lieu à Explorer",
    currentLocationSectionTitle: 'Découvrez Ce Qui Vous Entoure',
    orSeparatorText: "OU",
    locationNameLabel: 'Nom ou Description du Lieu',
    locationNamePlaceholder: 'Ex: Tour Eiffel, Paris',
    locationNameDescription: 'Tapez le nom ou une brève description.',
    autocompleteLoading: 'Chargement des suggestions...',
    autocompleteNoResults: 'Aucun résultat trouvé.',
    autocompleteErrorTitle: "Erreur d'Autocomplétion",
    useCurrentLocationButton: 'Utiliser Ma Position Actuelle',
    scanWithCameraButton: 'Scanner av/ Caméra',
    uploadImageButton: 'Télécharger Image',
    cancelCameraButton: 'Annuler Caméra',
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
    cameraAccessProblemTitle: "Problème d'Accès Caméra",
    cameraAccessProblemDescription: "Impossible d'accéder à la caméra. Veuillez vous assurer que les autorisations sont accordées.",
    cameraNotSupported: "Votre navigateur ne prend pas en charge l'accès à la caméra.",
    captureImageButton: "Capturer l'Image",
    imagePreviewTitle: 'Aperçu Image:',
    imagePreviewAlt: "Aperçu de l'image de lieu téléchargée ou capturée.",
    clearImageButton: 'Effacer Image',
    informationStyleLabel: "Comment voulez-vous entendre l'histoire ?",
    styleHistoricalLabel: 'Historique',
    styleHistoricalDescription: 'Concentrez-vous sur les faits, les dates et la signification historique.',
    styleCuriousLabel: 'Curieux',
    styleCuriousDescription: 'Découvrez des anecdotes intéressantes et des détails insolites.',
    styleLegendsLabel: 'Légendes',
    styleLegendsDescription: 'Explorez les mythes, le folklore et les histoires captivantes.',
    generateNarrativeButton: "Obtenir Réponse de l'Agent",
    generatingButton: "Contact de l'Agent...",
    loadingYear: "Chargement de l'année...",
    narrativeDisplayTitle: 'Chat Aijolot',
    narrativeDisplayDescription: "Interagissez avec votre guide touristique IA.",
    identifiedLocationLabel: 'Contexte du Lieu:',
    audioNarrationLabel: 'Narration Audio',
    initialNarrativeLabel: 'Narration Initiale',
    startConversationPlaceholder: 'Entrez les détails ci-dessus pour commencer votre visite guidée par IA !',
    audioNotSupported: "Votre navigateur ne supporte pas l'élément audio.",
    audioUnavailableTitle: 'Audio Non Disponible',
    audioUnavailableDescription: "L'audio pour cette narration n'a pas pu être généré ou n'est pas disponible.",
    narrativeTextLabel: "Réponse Texte de l'Agent",
    noNarrativeText: "Aucune réponse texte de l'agent disponible.",
    followUpQuestionLabel: 'Poser une Question de Suivi',
    micIssueAlertTitle: 'Problème de Microphone',
    micIssueAlertDescription: (error) => error,
    followUpPlaceholder: 'Posez une question de suivi...',
    stopRecordingButtonAria: "Arrêter l'enregistrement",
    startRecordingButtonAria: "Démarrer l'enregistrement",
    submitQuestionButton: 'Soumettre Question',
    gettingAnswerButton: 'Obtention Réponse...',
    aiThinking: "Aijolot réfléchit...",
    yourQuestionLabel: 'Votre Question:',
    aiAnswerLabel: "Réponse d'Aijolot:",
    followUpFailedToastTitle: 'Échec Question Suivi',
    followUpAnswerReadyToastTitle: 'Réponse de Suivi Prête !',
    followUpAnswerReadyToastDescription: 'Votre question a été répondue.',
    narrativeDisplayFooterWebhook: "Réponse de l'agent fournie par webhook externe. Audio généré par cette application.",
    exploreNewLocationButton: 'Explorer un Nouveau Lieu',
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

    