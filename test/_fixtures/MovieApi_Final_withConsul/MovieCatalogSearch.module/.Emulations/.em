<?xml version="1.0" encoding="ASCII"?>
<emulation:EmulationData xmlns:emulation="http:///emulation.ecore" isBW="true" location="MovieCatalogSearch.module">
  <ProcessNode Id="moviecatalogsearch.module.SearchMovies" Name="moviecatalogsearch.module.SearchMovies" ModelType="BW" moduleName="MovieCatalogSearch.module">
    <Operation Name="callProcess" serviceName="moviecatalogsearch.module.SearchMovies">
      <Inputs Id="eb579bc3-726c-421a-b356-73c625e86407MovieCatalogSearch.module_moviecatalogsearch.module.SearchMovies_callProcess_Start" Name="Start" isDefault="true" type="CALLPROCESS"/>
    </Operation>
  </ProcessNode>
  <ProcessNode Id="moviecatalogsearch.module.SortMovies" Name="moviecatalogsearch.module.SortMovies" ModelType="BW" moduleName="MovieCatalogSearch.module">
    <Operation Name="callProcess" serviceName="moviecatalogsearch.module.SortMovies">
      <Inputs Id="839db05d-b5e0-4aa6-b485-1f9d8aed77b6MovieCatalogSearch.module_moviecatalogsearch.module.SortMovies_callProcess_Start" Name="Start" isDefault="true" type="CALLPROCESS"/>
    </Operation>
  </ProcessNode>
  <ProcessNode Id="moviecatalogsearch.module.Process" Name="moviecatalogsearch.module.Process" ModelType="BW" moduleName="MovieCatalogSearch.module">
    <Operation Name="get" serviceName="movies">
      <Inputs Id="e0149214-547f-49e7-96f3-41ed216d4663MovieCatalogSearch.module_moviecatalogsearch.module.Process_get_getInput" Name="getInput" isDefault="true"/>
    </Operation>
  </ProcessNode>
  <ProcessNode Id="moviecatalogsearch.module.GetRatings" Name="moviecatalogsearch.module.GetRatings" ModelType="BW" moduleName="MovieCatalogSearch.module">
    <Operation Name="callProcess" serviceName="moviecatalogsearch.module.GetRatings">
      <Inputs Id="b82cb418-b83b-4cd5-9c15-afe20af3f876MovieCatalogSearch.module_moviecatalogsearch.module.GetRatings_callProcess_Start" Name="Start" isDefault="true" type="CALLPROCESS"/>
    </Operation>
  </ProcessNode>
</emulation:EmulationData>
