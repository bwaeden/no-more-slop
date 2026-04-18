const copyButtons = document.querySelectorAll<HTMLButtonElement>('.copy-btn');

copyButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const targetId = button.dataset.target;
    if (!targetId) return;
    const codeEl = document.getElementById(targetId);
    const value = codeEl?.textContent?.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      window.setTimeout(() => {
        button.textContent = original ?? 'Copy';
        button.classList.remove('copied');
      }, 1600);
    } catch {
      // Clipboard not available — ignore.
    }
  });
});
