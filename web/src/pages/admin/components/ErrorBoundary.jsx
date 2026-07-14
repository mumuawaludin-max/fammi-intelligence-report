import { Component } from 'react';
import { ErrorState } from './ErrorState';

/** Tanpa ini, exception apa pun yang lolos saat render (mis. field data tak terduga dari
 * Supabase) meng-unmount SELURUH React tree -- CMS jadi halaman putih kosong tanpa pesan,
 * kejadian nyata yang sulit didiagnosis dari sisi admin. Dibungkus di sekitar ScreenSwitch
 * (bukan seluruh Shell) supaya Sidebar/Topbar tetap tampil, admin masih bisa pindah layar
 * lain kalau satu layar crash. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('CMS screen crash:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="Layar ini gagal dimuat"
          desc={this.state.error?.message || String(this.state.error)}
          cta="Coba lagi"
          onCta={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
