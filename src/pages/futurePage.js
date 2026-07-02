export function renderFuturePage({ id, title, icon, description }) {
  return `
    <section class="page" id="${id}">
      <div class="card">
        <h3>${icon} ${title}</h3>
        <p class="muted">${description}</p>
      </div>
    </section>
  `;
}
