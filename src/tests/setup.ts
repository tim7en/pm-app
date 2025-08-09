import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  console.log('Setting up test environment...')
})

afterAll(async () => {
  // Cleanup global test environment
  console.log('Cleaning up test environment...')
})

beforeEach(() => {
  // Reset before each test
})

afterEach(() => {
  // Cleanup after each test
})