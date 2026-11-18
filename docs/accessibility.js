// Only the public page address and fixed navigation text are used by these controls.
export function accessibility({ el, action, show, body }) {
  const btn = document.getElementById("display-options");
  let reading = false;
  btn.onclick = () => {
    show("Lectura y acceso");
    const large = action(
      "Texto grande",
      () => {
        const active = document.documentElement.classList.toggle("large-text");
        large.setAttribute("aria-pressed", String(active));
      },
      "secondary",
    );
    large.setAttribute(
      "aria-pressed",
      String(document.documentElement.classList.contains("large-text")),
    );
    const status = el("p", undefined, "note");
    status.setAttribute("role", "status");
    const voice = action(
      "Escuchar orientación",
      () => {
        if (!("speechSynthesis" in window)) {
          status.textContent = "Este navegador no ofrece lectura en voz alta.";
          return;
        }
        if (reading) {
          speechSynthesis.cancel();
          return;
        }
        const local = speechSynthesis
          .getVoices()
          .find((v) => v.localService && v.lang.toLowerCase().startsWith("es"));
        if (!local) {
          status.textContent =
            "No hay una voz local en español disponible en este navegador.";
          return;
        }
        const utterance = new SpeechSynthesisUtterance(
          document.getElementById("intro-text").textContent +
            " Puedes explorar las herramientas o buscar en la biblioteca.",
        );
        utterance.voice = local;
        utterance.lang = local.lang;
        utterance.onend = utterance.onerror = () => {
          reading = false;
          voice.textContent = "Escuchar orientación";
        };
        reading = true;
        voice.textContent = "Detener lectura";
        speechSynthesis.speak(utterance);
      },
      "secondary",
    );
    const share = action(
      "Copiar enlace del recorrido",
      async () => {
        const url = new URL("./", location.href);
        if (
          document.getElementById("pac").getAttribute("aria-pressed") === "true"
        )
          url.searchParams.set("vista", "pacientes");
        try {
          await navigator.clipboard.writeText(url.href);
          status.textContent = "Enlace copiado.";
        } catch {
          status.textContent = "Enlace para copiar: " + url.href;
        }
      },
      "secondary",
    );
    body.append(large, voice, share, status);
  };
  document.getElementById("panel").addEventListener("close", () => {
    if (reading && "speechSynthesis" in window) speechSynthesis.cancel();
    reading = false;
  });
}
