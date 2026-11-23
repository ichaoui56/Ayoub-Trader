import App from "../App";
import { LocaleProvider } from "../components/LocaleProvider";

export default function Page() {
  return <LocaleProvider initialLocale="en"><App /></LocaleProvider>;
}
