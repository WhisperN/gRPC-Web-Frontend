export default function expandMenu(name: string) {
    let expand = document.getElementsByClassName(name+"-menu").item(0);
    let ctl = document.getElementsByClassName(name+"-collapse").item(0);
    let up = document.getElementById(name+"-up");
    let down = document.getElementById(name+"-down");

    if (expand?.getAttribute("collapsed") == "true") {
        expand?.classList.toggle("hidden");
        expand?.setAttribute("collapsed", "false");
        down?.removeAttribute("hidden");
        up?.setAttribute("hidden", "");
    } else  {
        expand?.setAttribute("collapsed", "true");
        expand?.classList.toggle("hidden");
        down?.setAttribute("hidden", "");
        up?.removeAttribute("hidden");
    }
}

(window as any).expandMenu = expandMenu;