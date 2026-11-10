export const getCitationsService = (response) => {
  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return groundingChunks
    .map((chunk) => {
      const source = chunk.web || chunk.retrievedContext;

      if (!source?.uri) return null;

      return {
        title: source.title || "Source",
        url: source.uri,
      };
    })
    .filter(Boolean);
};

export const formatCitationsService = (citations) => {
  const uniqueCitations = [
    ...new Map(citations.map((item) => [item.url, item])).values(),
  ];

  if (!uniqueCitations.length) return "";

  return `\n\n### Sources\n${uniqueCitations
    .map(
      (source, index) =>
        `[${index + 1}] [${source.title}](${source.url})`,
    )
    .join("\n")}`;
};