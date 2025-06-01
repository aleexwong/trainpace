import { createPortal } from "react-dom";
import SideNav from "./SideNav";

export default function SideNavPortal() {
  return createPortal(<SideNav />, document.body);
}
// This component renders the SideNav component into a portal, allowing it to be rendered outside the normal DOM hierarchy.
