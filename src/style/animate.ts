export default function expandMenu(name: string) {
    let expand = document.getElementsByClassName(name+"-menu").item(0);
    let up = document.getElementById(name+"-up");
    let down = document.getElementById(name+"-down");

    if (expand?.getAttribute("collapsed") == "true") {
        expand?.classList.toggle(name+"-hidden");
        expand?.setAttribute("collapsed", "false");
        down?.removeAttribute("hidden");
        up?.setAttribute("hidden", "");
    } else  {
        expand?.setAttribute("collapsed", "true");
        expand?.classList.toggle(name+"-hidden");
        down?.setAttribute("hidden", "");
        up?.removeAttribute("hidden");
    }
}

export function setupDropdown(dropdownSelector: string) {
    const dropdown = document.querySelector<HTMLElement>(dropdownSelector);
    if (!dropdown) return;

    const button = dropdown.querySelector<HTMLButtonElement>('.wasm-webgl');
    const menu = dropdown.querySelector<HTMLElement>('.wasm-webgl-menu');

    if (!button || !menu) return;

    // Helper to open/close menu
    const toggleMenu = (open?: boolean) => {
        const isOpen = open ?? !dropdown.classList.contains('open');
        dropdown.classList.toggle('open', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            menu.focus();
        }
    };

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target as Node)) {
            toggleMenu(false);
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleMenu(false);
            button.focus();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupDropdown('.dropdown');
});

(window as any).expandMenu = expandMenu;