const { z } = require("zod");

// We strictly require the amount to be passed as a STRING from React.
// Passing floats directly in JSON (e.g., {"amount": 450.55}) risks precision loss
// before it even reaches our server. We use Regex to ensure it's a valid positive number.
const transactionValidationSchema = z.object({
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a positive number string with up to 2 decimal places",
    ),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT"], {
    errorMap: () => ({
      message: "Type must be INCOME, EXPENSE, or INVESTMENT",
    }),
  }),
  category: z.string().min(1, "Category cannot be empty").trim(),
  description: z.string().max(200).optional(),
  date: z.string().datetime().optional(), // Expects a valid ISO 8601 string if provided
});

// Express Middleware
const validateTransaction = (req, res, next) => {
  try {
    // Parse and validate the incoming request body
    const validatedData = transactionValidationSchema.parse(req.body);

    // Replace req.body with the sanitized/validated data
    req.body = validatedData;
    next();
  } catch (error) {
    // If validation fails, immediately reject the request with a 400 Bad Request
    return res.status(400).json({
      success: false,
      message: "Data Validation Failed",
      errors: error.errors?.map((err) => ({
        field: err.path[0],
        message: err.message,
      })) || [{ message: error.message }],
    });
  }
};

module.exports = validateTransaction;
