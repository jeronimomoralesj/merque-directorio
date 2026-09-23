// app/crm/quiz/quizData.js

export const QUIZ_PASS_THRESHOLD = 2; // need 2+ correct to unlock roulette

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: '¿Qué medida de llanta corresponde a un rin 15 con perfil 65 y ancho 195?',
    options: [
      { id: 'a', label: '195/65R15' },
      { id: 'b', label: '15/65R195' },
      { id: 'c', label: '195R15/65' },
      { id: 'd', label: '65/195R15' },
    ],
    correct: 'a',
  },
  {
    id: 'q2',
    question: '¿Con qué frecuencia se recomienda rotar las llantas de un vehículo de pasajeros?',
    options: [
      { id: 'a', label: 'Cada 40.000 km' },
      { id: 'b', label: 'Cada 5.000 – 10.000 km' },
      { id: 'c', label: 'Solo cuando se pinchan' },
      { id: 'd', label: 'Nunca, no es necesario' },
    ],
    correct: 'b',
  },
  {
    id: 'q3',
    question: '¿Qué indica el número 88 en una llanta marcada como 195/65R15 88H?',
    options: [
      { id: 'a', label: 'El año de fabricación' },
      { id: 'b', label: 'El índice de velocidad' },
      { id: 'c', label: 'El índice de carga' },
      { id: 'd', label: 'El ancho en milímetros' },
    ],
    correct: 'c',
  },
];