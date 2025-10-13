import * as Yup from "yup";

export const emailFormSchema = Yup.object().shape({
  userName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("User name is required"),

  userEmail: Yup.string()
    .email("Invalid email address")
    .required("User email is required"),

  subject: Yup.string()
    .min(3, "Subject must be at least 3 characters")
    .required("Subject is required"),

  body: Yup.string()
    .min(10, "Email body must be at least 10 characters")
    .required("Email body is required"),
});
