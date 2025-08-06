import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Package,
  Zap,
  Shield,
  Link2,
  Sparkles,
  FileText,
  Search,
  Rocket,
} from 'lucide-react'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Convex Service - Enhanced Convex with Zod Validation',
  description:
    'A TypeScript package that supercharges Convex with Zod schema validation and provides a fluent builder pattern for database operations with type safety, relations, and more.',
  keywords: ['convex', 'relational', 'sql', 'convex-helpers'],
})

export default async function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fd-muted/50 border">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Convex Service</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-fd-foreground to-fd-muted-foreground bg-clip-text text-transparent">
            Enhanced Convex with Zod Validation
          </h1>

          <p className="text-xl text-fd-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A TypeScript package that supercharges Convex with Zod schema
            validation and provides a fluent builder pattern for database
            operations with type safety, relations, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs/home"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground font-semibold hover:bg-fd-primary/90 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/docs/api-reference"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-fd-border bg-fd-background hover:bg-fd-muted/50 transition-colors"
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>

      <div className="py-20 px-6 bg-fd-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Convex Service?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fluent Builder API</h3>
              <p className="text-sm text-fd-muted-foreground">
                Define schemas with a chainable, intuitive interface
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Type Safety</h3>
              <p className="text-sm text-fd-muted-foreground">
                Full TypeScript support with excellent IntelliSense
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Link2 className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Relations</h3>
              <p className="text-sm text-fd-muted-foreground">
                Define foreign keys with cascade/fail deletion policies
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Unique Constraints</h3>
              <p className="text-sm text-fd-muted-foreground">
                Handle conflicts with replace or fail strategies
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Default Values</h3>
              <p className="text-sm text-fd-muted-foreground">
                Set field defaults with functions or static values
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Advanced Indexing</h3>
              <p className="text-sm text-fd-muted-foreground">
                Support for search and vector indexes
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Rocket className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Batch Operations</h3>
              <p className="text-sm text-fd-muted-foreground">
                Efficient bulk inserts, updates, and deletes
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-fd-background">
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2">Optional Validation</h3>
              <p className="text-sm text-fd-muted-foreground">
                Add validation only when needed - zero performance cost
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-fd-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Follow these guides to quickly set up Convex Service in your project
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/docs/getting-started"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <Rocket className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                Quick Start Guide
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Install, configure, and create your first validated service
              </p>
            </Link>

            <Link
              href="/docs/service-builder/defining-services"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <Package className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                Defining Services
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Learn the service builder pattern and available methods
              </p>
            </Link>

            <Link
              href="/docs/database-operations/insert-operations"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <Zap className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                Database Operations
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Master insert, update, patch, and delete operations
              </p>
            </Link>

            <Link
              href="/docs/advanced/relations"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <Link2 className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                Relations & Constraints
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Set up foreign keys, unique constraints, and advanced features
              </p>
            </Link>

            <Link
              href="/docs/api-reference/service-builder"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <FileText className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                API Reference
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Complete reference for all methods and types
              </p>
            </Link>

            <Link
              href="/docs/ai-api-reference"
              className="group p-6 rounded-lg border bg-fd-background hover:bg-fd-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-fd-primary/10 flex items-center justify-center mb-4 group-hover:bg-fd-primary/20 transition-colors">
                <Sparkles className="w-5 h-5 text-fd-primary" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-fd-primary transition-colors">
                AI Reference
              </h3>
              <p className="text-sm text-fd-muted-foreground">
                Comprehensive API guide for AI assistants like Claude & ChatGPT
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
