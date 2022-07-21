import getContactHref from "./get-contact-href";

test("getContactHref", () => {
  expect(getContactHref("email", "#")).toBe("mailto:larrieu.sebastian@gmail.com");
  expect(getContactHref("github", "#")).toBe("https://github.com/sebalr");
  expect(getContactHref("linkedin", "#")).toBe("https://www.linkedin.com/in/slarrieu/");
});
