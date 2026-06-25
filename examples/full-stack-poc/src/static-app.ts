export const STATIC_TODO_HTML = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Todo PoC</title></head>
  <body>
    <h1 data-testid="title">Todo PoC</h1>
    <ul id="list"></ul>
    <form id="form">
      <input id="input" name="title" />
      <button type="submit">add</button>
    </form>
    <script>
      const list = document.getElementById('list');
      const form = document.getElementById('form');
      const input = document.getElementById('input');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        const li = document.createElement('li');
        li.setAttribute('data-testid', 'item');
        li.textContent = value;
        list.appendChild(li);
        input.value = '';
      });
    </script>
  </body>
</html>`;
