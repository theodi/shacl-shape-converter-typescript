export class NamingUtils {

  static toClassName(uri: string): string {
    const name = uri.split(/[/#]/).pop() || "Resource"
    //return NamingUtils.pascalCase(name)
    return name
  }

  static toPropertyName(uri: string): string {
    const name = uri.split(/[/#]/).pop() || "property"
    return NamingUtils.camelCase(name)
  }

  static pascalCase(text: string): string {
    const words = NamingUtils.splitWords(text)
    return words.map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join("")
  }

  static camelCase(text: string): string {
    const words = NamingUtils.splitWords(text)

    return words[0].toLowerCase() +
      words.slice(1).map(w =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join("")
  }

  private static splitWords(text: string): string[] {
    return text
      .replace(/[-_/#]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  }
}