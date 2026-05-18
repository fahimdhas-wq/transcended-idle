
<script lang="ts">
  import { formatValue } from '../systems/formatValue.js';
  let { n }: { n: any } = $props();
</script>

{formatValue(n)}
