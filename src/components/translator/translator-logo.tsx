import Image from "next/image";

export function TranslatorLogo() {
  return (
    <div className="inline-flex items-center" aria-label="Plain Language Translator">
      <Image
        src="/lingua-logo.svg"
        alt="Plain Language Translator"
        width={1838}
        height={691}
        priority
        className="h-11 w-auto sm:h-12"
      />
    </div>
  );
}
