import logo from '../assets/logo.webp';

// Madi Sushi brend logotipi
export default function Logo({ size = 44, className = '' }) {
  return <img className={`brand__logo ${className}`} src={logo} width={size} height={size} alt="Madi Sushi" draggable="false" />;
}
