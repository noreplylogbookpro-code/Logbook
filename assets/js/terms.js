document.addEventListener('DOMContentLoaded', () => {
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.innerText = `© ${new Date().getFullYear()}`;
});