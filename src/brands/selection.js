// Marca elegida en el selector del chat, leída por postMessage.
// undefined = sin cambios (el backend conserva la del chat) | null = sin marca | uuid.
// ponytail: estado de módulo en vez de props; hay 6 sitios que llaman onSendMessage.
let choice;

export const getBrandChoice = () => choice;
export const setBrandChoice = (id) => {
  choice = id;
};
