const SeverityBadge = ({ severity }) => {
  const styles = {
    Critical: 'bg-red-900 text-red-300 border-red-700',
    High: 'bg-orange-900 text-orange-300 border-orange-700',
    Medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    Low: 'bg-green-900 text-green-300 border-green-700',
  };

  const badgeStyle = styles[severity] || styles.Low;

  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${badgeStyle}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
