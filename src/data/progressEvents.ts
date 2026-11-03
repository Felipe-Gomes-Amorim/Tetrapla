// Emissor simples para avisar a navbar (sempre montada) que o progresso de leitura mudou.
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitProgressChanged() {
  listeners.forEach(l => l());
}
