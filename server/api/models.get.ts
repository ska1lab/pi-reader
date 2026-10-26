import { getPiSession } from "../utils/pi-session";

export default defineEventHandler(async () => {
  const session = await getPiSession();

  const availableModels = await session.modelRuntime.getAvailable();

  const models = availableModels.map((model) => {
    return {
      provider: model.provider,
      id: model.id,
      name: model.name,
    };
  });

  const currentModel = session.model
    ? {
        provider: session.model.provider,
        id: session.model.id,
        name: session.model.name,
      }
    : null;
  return {
    models,
    currentModel,
  };
});
