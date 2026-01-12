/**
 * Server-safe utility for generating Answer Capsule structured data
 * Can be used in both server and client components
 */

export function getAnswerCapsuleSchema(props: {
  question: string;
  answer: string;
  dateModified?: string;
}) {
  return {
    "@type": "Question",
    name: props.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: props.answer,
      dateModified: props.dateModified,
    },
  };
}
