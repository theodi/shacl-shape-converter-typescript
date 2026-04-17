import { TermWrapper, LiteralAs, LiteralFrom, SetFrom } from "@rdfjs/wrapper";

export class VCardAddress extends TermWrapper {

  get streetAddress(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#street-address", LiteralAs.string, LiteralFrom.string);
  }

  get extendedAddress(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#extended-address", LiteralAs.string, LiteralFrom.string);
  }

  get locality(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#locality", LiteralAs.string, LiteralFrom.string);
  }

  get region(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#region", LiteralAs.string, LiteralFrom.string);
  }

  get postalCode(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#postal-code", LiteralAs.string, LiteralFrom.string);
  }

  get countryName(): Set<string> {
    return SetFrom.subjectPredicate(this, "http://www.w3.org/2006/vcard/ns#country-name", LiteralAs.string, LiteralFrom.string);
  }
}
