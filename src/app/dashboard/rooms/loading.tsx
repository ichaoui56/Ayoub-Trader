export default function RoomsLoading() {
  return (
    <div className="platform-page private-rooms-page" aria-label="Loading private rooms">
      <div className="rooms-index-heading">
        <div className="room-loading-heading"><span /><span /></div>
        <div className="room-loading-actions"><span /><span /></div>
      </div>
      <div className="private-room-kpis">
        {[0, 1, 2].map((item) => <article className="room-loading-kpi" key={item}><span /><div><i /><i /></div></article>)}
      </div>
      <div className="dash-room-cards">
        {[0, 1, 2].map((item) => <article className="room-loading-card" key={item}><span /><div><i /><i /><i /></div></article>)}
      </div>
    </div>
  );
}
