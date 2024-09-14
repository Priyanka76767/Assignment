import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import axios from "axios";
import "primereact/resources/themes/lara-light-indigo/theme.css";  // Theme
import "primereact/resources/primereact.min.css";  // Core CSS
import "primeicons/primeicons.css";  // PrimeIcons

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
}

const ArtworksTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [rowsToSelect, setRowsToSelect] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const overlayPanel = useRef<OverlayPanel>(null);

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );
      const artworksData = response.data.data.map((artwork: any) => ({
        id: artwork.id,
        title: artwork.title,
        place_of_origin: artwork.place_of_origin,
        artist_display: artwork.artist_display,
        inscriptions: artwork.inscriptions,
        date_start: artwork.date_start,
        date_end: artwork.date_end,
      }));

      setArtworks(artworksData);
      setTotalRecords(response.data.pagination.total);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setCurrentPage(event.page + 1);
  };

  const onSelectionChange = (e: any) => {
    setSelectedArtworks(e.value);
  };

  const handleSelectRows = async () => {
    console.log("Starting to handle row selection");
    let remaining = rowsToSelect;
    const selected = [...selectedArtworks];

    for (let i = 0; i < artworks.length && remaining > 0; i++) {
      if (!selected.some((artwork) => artwork.id === artworks[i].id)) {
        selected.push(artworks[i]);
        remaining--;
      }
    }

    let page = currentPage + 1;
    while (remaining > 0) {
      try {
        const response = await axios.get(
          `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
        );
        const nextPageData = response.data.data.map((artwork: any) => ({
          id: artwork.id,
          title: artwork.title,
          place_of_origin: artwork.place_of_origin,
          artist_display: artwork.artist_display,
          inscriptions: artwork.inscriptions,
          date_start: artwork.date_start,
          date_end: artwork.date_end,
        }));

        for (let i = 0; i < nextPageData.length && remaining > 0; i++) {
          if (!selected.some((artwork) => artwork.id === nextPageData[i].id)) {
            selected.push(nextPageData[i]);
            remaining--;
          }
        }

        if (nextPageData.length < rows) break;

        page++;
      } catch (error) {
        console.error("Error fetching additional pages", error);
        break;
      }
    }

    console.log("Selected artworks: ", selected);
    setSelectedArtworks(selected);
    overlayPanel.current?.hide();
  };

  return (
    <div>
      {/* Button to trigger the OverlayPanel */}
      <Button
        icon="pi pi-check"
        className="p-button-secondary"
        onClick={(e) => overlayPanel.current?.toggle(e)}
        label="Select Rows"
      />

      {/* OverlayPanel with Input for number of rows */}
      <OverlayPanel ref={overlayPanel}>
        <div className="p-field">
          <label htmlFor="rowsToSelect">Number of Rows to Select</label>
          <InputNumber
            id="rowsToSelect"
            value={rowsToSelect}
            onValueChange={(e) => setRowsToSelect(e.value || 0)}
            min={0}
            max={totalRecords}
          />
          <Button
            label="Select"
            className="p-button-secondary mt-2"
            onClick={handleSelectRows}
            style={{ backgroundColor: '#FF5722', color: '#FFFFFF' }}
          />
        </div>
      </OverlayPanel>

      {/* DataTable Component with row checkbox selection */}
      <DataTable
        value={artworks}
        paginator={false}
        loading={loading}
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        selectionMode="checkbox"
      >
        {/* Column for checkboxes */}
        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
        <Column field="title" header={<div>Title <i className="pi pi-check" onClick={(e) => overlayPanel.current?.toggle(e)}></i></div>} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>

      {/* Paginator Component */}
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default ArtworksTable;

