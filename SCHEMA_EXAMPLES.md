# Dynamic UI Schema Examples

This document provides example schemas that the AI model can generate for various use cases.

## 1. Simple Contact Form

```json
{
  "type": "container",
  "props": { "maxWidth": 600, "variant": "default" },
  "children": [
    {
      "type": "card",
      "props": { "title": "Contact Us", "elevated": true },
      "children": [
        {
          "type": "grid",
          "props": { "columns": 1, "gap": 16 },
          "children": [
            {
              "type": "input",
              "props": {
                "id": "name",
                "label": "Full Name",
                "placeholder": "John Doe",
                "required": true
              }
            },
            {
              "type": "input",
              "props": {
                "id": "email",
                "type": "email",
                "label": "Email Address",
                "placeholder": "john@example.com",
                "required": true
              }
            },
            {
              "type": "textarea",
              "props": {
                "id": "message",
                "label": "Message",
                "placeholder": "Tell us about your inquiry...",
                "rows": 4,
                "required": true
              }
            },
            {
              "type": "button",
              "props": {
                "label": "Send Message",
                "variant": "primary",
                "type": "submit"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 2. User Registration Form with Validation

```json
{
  "type": "container",
  "props": { "maxWidth": 500 },
  "children": [
    {
      "type": "card",
      "props": { "title": "Create Account", "elevated": true, "padding": 2 },
      "children": [
        {
          "type": "grid",
          "props": { "columns": 1, "gap": 12 },
          "children": [
            {
              "type": "input",
              "props": {
                "id": "username",
                "label": "Username",
                "placeholder": "Choose a username",
                "required": true,
                "pattern": "^[a-zA-Z0-9_]{3,20}$",
                "error": "Username must be 3-20 characters, alphanumeric and underscore only"
              }
            },
            {
              "type": "input",
              "props": {
                "id": "email",
                "type": "email",
                "label": "Email",
                "placeholder": "your@email.com",
                "required": true
              }
            },
            {
              "type": "input",
              "props": {
                "id": "password",
                "type": "password",
                "label": "Password",
                "required": true
              }
            },
            {
              "type": "input",
              "props": {
                "id": "password_confirm",
                "type": "password",
                "label": "Confirm Password",
                "required": true
              }
            },
            {
              "type": "checkbox",
              "props": {
                "id": "terms",
                "label": "I agree to the terms and conditions",
                "required": true
              }
            },
            {
              "type": "button",
              "props": {
                "label": "Create Account",
                "variant": "primary",
                "size": "large"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 3. Survey Form with Radio Buttons and Select

```json
{
  "type": "card",
  "props": { "title": "Customer Satisfaction Survey", "elevated": true },
  "children": [
    {
      "type": "grid",
      "props": { "columns": 1, "gap": 20 },
      "children": [
        {
          "type": "radio",
          "props": {
            "groupLabel": "How satisfied are you with our service?",
            "options": [
              { "label": "Very Satisfied", "value": "very_satisfied" },
              { "label": "Satisfied", "value": "satisfied" },
              { "label": "Neutral", "value": "neutral" },
              { "label": "Dissatisfied", "value": "dissatisfied" }
            ]
          }
        },
        {
          "type": "select",
          "props": {
            "label": "Which product did you use?",
            "placeholder": "Select a product",
            "options": [
              { "label": "Product A", "value": "product_a" },
              { "label": "Product B", "value": "product_b" },
              { "label": "Product C", "value": "product_c" }
            ]
          }
        },
        {
          "type": "textarea",
          "props": {
            "label": "Additional Comments",
            "placeholder": "Please share any additional feedback...",
            "rows": 3,
            "maxLength": 500
          }
        },
        {
          "type": "button",
          "props": { "label": "Submit Survey", "variant": "success" }
        }
      ]
    }
  ]
}
```

## 4. Data Table with Display

```json
{
  "type": "container",
  "children": [
    {
      "type": "card",
      "props": { "title": "Users" },
      "children": [
        {
          "type": "table",
          "props": {
            "columns": [
              { "key": "id", "label": "ID", "width": "50px" },
              { "key": "name", "label": "Name", "sortable": true },
              { "key": "email", "label": "Email", "sortable": true },
              { "key": "role", "label": "Role" },
              { "key": "joined", "label": "Joined Date", "sortable": true }
            ],
            "data": [
              {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com",
                "role": "Admin",
                "joined": "2024-01-15"
              },
              {
                "id": 2,
                "name": "Jane Smith",
                "email": "jane@example.com",
                "role": "User",
                "joined": "2024-01-20"
              }
            ],
            "striped": true,
            "bordered": true,
            "hoverable": true
          }
        }
      ]
    }
  ]
}
```

## 5. Tabbed Interface

```json
{
  "type": "card",
  "props": { "title": "Settings" },
  "children": [
    {
      "type": "tabs",
      "props": {
        "defaultTab": "profile",
        "tabs": [
          {
            "label": "Profile",
            "value": "profile",
            "contentTemplate": {
              "type": "grid",
              "props": { "columns": 1, "gap": 12 },
              "children": [
                {
                  "type": "input",
                  "props": {
                    "label": "Full Name",
                    "value": "John Doe"
                  }
                },
                {
                  "type": "input",
                  "props": {
                    "type": "email",
                    "label": "Email",
                    "value": "john@example.com"
                  }
                },
                {
                  "type": "button",
                  "props": { "label": "Save", "variant": "primary" }
                }
              ]
            }
          },
          {
            "label": "Security",
            "value": "security",
            "contentTemplate": {
              "type": "grid",
              "props": { "columns": 1, "gap": 12 },
              "children": [
                {
                  "type": "input",
                  "props": {
                    "type": "password",
                    "label": "Current Password"
                  }
                },
                {
                  "type": "input",
                  "props": {
                    "type": "password",
                    "label": "New Password"
                  }
                },
                {
                  "type": "button",
                  "props": { "label": "Update", "variant": "primary" }
                }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

## 6. Multi-Step Wizard

```json
{
  "type": "wizard-stepper",
  "props": {
    "steps": [
      {
        "id": "step_1",
        "label": "Personal Info",
        "description": "Basic information",
        "contentTemplate": {
          "type": "grid",
          "props": { "columns": 1, "gap": 12 },
          "children": [
            {
              "type": "input",
              "props": {
                "label": "First Name",
                "placeholder": "John"
              }
            },
            {
              "type": "input",
              "props": {
                "label": "Last Name",
                "placeholder": "Doe"
              }
            }
          ]
        }
      },
      {
        "id": "step_2",
        "label": "Address",
        "description": "Where do you live?",
        "contentTemplate": {
          "type": "grid",
          "props": { "columns": 1, "gap": 12 },
          "children": [
            {
              "type": "input",
              "props": {
                "label": "Street Address"
              }
            },
            {
              "type": "input",
              "props": {
                "label": "City"
              }
            }
          ]
        }
      },
      {
        "id": "step_3",
        "label": "Review",
        "description": "Confirm details",
        "completed": false,
        "contentTemplate": {
          "type": "card",
          "props": { "title": "Review Your Information" },
          "children": [
            {
              "type": "button",
              "props": {
                "label": "Confirm",
                "variant": "success"
              }
            }
          ]
        }
      }
    ]
  }
}
```

## 7. Product Listing with Grid

```json
{
  "type": "container",
  "props": { "variant": "fluid" },
  "children": [
    {
      "type": "grid",
      "props": { "columns": "repeat(3, 1fr)", "gap": 16 },
      "children": [
        {
          "type": "card",
          "props": { "title": "Product A", "elevated": true },
          "children": [
            {
              "type": "grid",
              "props": { "columns": 1, "gap": 8 },
              "children": [
                { "type": "input", "props": { "value": "Price: $99" } },
                {
                  "type": "button",
                  "props": {
                    "label": "Add to Cart",
                    "variant": "primary",
                    "size": "small"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "card",
          "props": { "title": "Product B", "elevated": true },
          "children": [
            {
              "type": "grid",
              "props": { "columns": 1, "gap": 8 },
              "children": [
                { "type": "input", "props": { "value": "Price: $79" } },
                {
                  "type": "button",
                  "props": {
                    "label": "Add to Cart",
                    "variant": "primary",
                    "size": "small"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 8. Filter Panel with Form

```json
{
  "type": "grid",
  "props": { "columns": "1fr 3fr", "gap": 20 },
  "children": [
    {
      "type": "card",
      "props": { "title": "Filters" },
      "children": [
        {
          "type": "grid",
          "props": { "columns": 1, "gap": 16 },
          "children": [
            {
              "type": "select",
              "props": {
                "label": "Category",
                "options": [
                  { "label": "All", "value": "all" },
                  { "label": "Electronics", "value": "electronics" },
                  { "label": "Clothing", "value": "clothing" }
                ]
              }
            },
            {
              "type": "radio",
              "props": {
                "groupLabel": "Price Range",
                "options": [
                  { "label": "Under $50", "value": "under_50" },
                  { "label": "$50 - $100", "value": "50_100" },
                  { "label": "Over $100", "value": "over_100" }
                ]
              }
            },
            {
              "type": "checkbox",
              "props": {
                "label": "In Stock Only"
              }
            },
            {
              "type": "button",
              "props": {
                "label": "Apply Filters",
                "variant": "primary"
              }
            }
          ]
        }
      ]
    },
    {
      "type": "card",
      "props": { "title": "Results" },
      "children": [
        {
          "type": "list",
          "props": {
            "items": [
              {
                "id": "1",
                "label": "Product Name",
                "description": "Brief description here",
                "icon": "📦"
              },
              {
                "id": "2",
                "label": "Another Product",
                "description": "More details",
                "icon": "📦"
              }
            ],
            "styled": true
          }
        }
      ]
    }
  ]
}
```

## 9. Dashboard with Charts

```json
{
  "type": "container",
  "children": [
    {
      "type": "grid",
      "props": { "columns": "repeat(2, 1fr)", "gap": 16 },
      "children": [
        {
          "type": "card",
          "props": { "title": "Revenue" },
          "children": [
            {
              "type": "basic-chart",
              "props": {
                "type": "bar",
                "title": "Monthly Revenue",
                "data": [
                  { "label": "Jan", "value": 4000 },
                  { "label": "Feb", "value": 3000 },
                  { "label": "Mar", "value": 5000 }
                ],
                "width": 400,
                "height": 300
              }
            }
          ]
        },
        {
          "type": "card",
          "props": { "title": "User Growth" },
          "children": [
            {
              "type": "basic-chart",
              "props": {
                "type": "line",
                "title": "Active Users",
                "data": [
                  { "label": "Jan", "value": 100 },
                  { "label": "Feb", "value": 150 },
                  { "label": "Mar", "value": 120 }
                ],
                "width": 400,
                "height": 300
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 10. Error State Display

```json
{
  "type": "error",
  "props": {
    "title": "Operation Failed",
    "message": "Unable to save your changes. Please check your internet connection and try again.",
    "details": "Error: Connection timeout after 30 seconds. Server did not respond.",
    "dismissible": true,
    "visible": true
  }
}
```

## JSON Patch Update Examples

### Add a field to a form
```json
[
  {
    "op": "add",
    "path": "/children/0/children/0/children/-",
    "value": {
      "type": "input",
      "props": {
        "label": "Phone Number",
        "type": "tel"
      }
    }
  }
]
```

### Update form title
```json
[
  {
    "op": "replace",
    "path": "/children/0/props/title",
    "value": "Updated Form Title"
  }
]
```

### Add validation error
```json
[
  {
    "op": "add",
    "path": "/children/0/children/0/children/0/props/error",
    "value": "This field is required"
  }
]
```

### Disable button
```json
[
  {
    "op": "replace",
    "path": "/children/0/children/0/children/-/props/disabled",
    "value": true
  }
]
```

### Remove a field
```json
[
  {
    "op": "remove",
    "path": "/children/0/children/0/children/2"
  }
]
```

### Replace entire card content
```json
[
  {
    "op": "replace",
    "path": "/children/0/children/0/children",
    "value": [
      {
        "type": "input",
        "props": {
          "label": "Completely new field"
        }
      }
    ]
  }
]
```

---

These examples demonstrate the flexibility and power of the Dynamic UI System. The AI model can generate any combination of these patterns to create complex, interactive user interfaces dynamically.
