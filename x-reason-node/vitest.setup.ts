import { config } from 'dotenv'

// Load environment variables
config()

// Set up mock environment variables for testing if they don't exist
if (!process.env.OSDK_CLIENT_ID) {
  process.env.OSDK_CLIENT_ID = 'test-client-id'
}

if (!process.env.OSDK_CLIENT_SECRET) {
  process.env.OSDK_CLIENT_SECRET = 'test-client-secret'
}

if (!process.env.FOUNDRY_TOKEN) {
  process.env.FOUNDRY_TOKEN = 'test-foundry-token'
}
