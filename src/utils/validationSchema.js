import * as Yup from "yup";

export const emailFormSchema = Yup.object().shape({
  userName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Sender name is required"),

  senderEmail: Yup.string()   
    .email("Invalid email format")
    .required("Sender email is required"),

  subject: Yup.string()
    .min(3, "Subject must be at least 3 characters")
    .required("Subject is required"),

  body: Yup.string()
    .min(10, "Email body must be at least 10 characters")
    .required("Email body is required"),

  recipientsPerSender: Yup.number()
    .min(1, "Minimum 1 recipient required")
    .max(100, "Maximum 100 recipients allowed")
    .required("Recipients per sender is required"),

  csvFile: Yup.mixed().required("CSV file is required"),
});
