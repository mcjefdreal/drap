<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const emptyRootVariants = tv({
    base: 'flex min-w-0 grow flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-6 text-center text-balance md:p-12',
    variants: {
      variant: {
        default: '',
        info: 'preset-tonal-accent',
        success: 'preset-tonal-success',
        warning: 'preset-tonal-warning',
        destructive: 'preset-tonal-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  });

  export type EmptyRootVariant = VariantProps<typeof emptyRootVariants>['variant'];
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef } from '$lib/components/ui/utils';

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = 'default',
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & { variant?: EmptyRootVariant } = $props();
</script>

<div
  bind:this={ref}
  data-slot="empty"
  data-variant={variant}
  class={cn(emptyRootVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
